/**
 * Hoichan (Discussion) Controller
 * Handles HTTP requests for discussion endpoints
 */
import { Elysia, t } from "elysia"
import { ResponseDto, BadRequestError, UnauthorizedError } from "../../../shared/response.dto"
import {
  CreateHoichanMessageUseCase,
  GetHoichanMessagesUseCase,
  HeartHoichanMessageUseCase,
  DeleteHoichanMessageUseCase,
} from "../../../application/use-cases/hoichan-message.use-case"
import type { IHoichanRepository } from "../../../domain/repositories/hoichan-message.repository.interface"
import type { GoogleUserPayload } from "../../../modules/auth/auth.service"

export class HoichanController {
  private getMessagesUseCase: GetHoichanMessagesUseCase
  private createMessageUseCase: CreateHoichanMessageUseCase
  private heartMessageUseCase: HeartHoichanMessageUseCase
  private deleteMessageUseCase: DeleteHoichanMessageUseCase

  constructor(hoichanRepo: IHoichanRepository) {
    this.getMessagesUseCase = new GetHoichanMessagesUseCase(hoichanRepo)
    this.createMessageUseCase = new CreateHoichanMessageUseCase(hoichanRepo)
    this.heartMessageUseCase = new HeartHoichanMessageUseCase(hoichanRepo)
    this.deleteMessageUseCase = new DeleteHoichanMessageUseCase(hoichanRepo)
  }

  registerRoutes(
    app: ReturnType<typeof Elysia>,
    verifyToken: (token: string) => boolean,
    verifyGoogleToken: (token: string) => Promise<GoogleUserPayload & { isAdmin: boolean }>
  ) {
    return app.group("/hoichan", (app) =>
      app
        .get("/messages", async () => {
          const messages = await this.getMessagesUseCase.execute(50)
          return ResponseDto.success(messages)
        })
        .post(
          "/messages",
          async ({ body, bearer }) => {
            if (!bearer) {
              throw new UnauthorizedError("Missing Google token")
            }

            let user: GoogleUserPayload & { isAdmin: boolean }
            try {
              user = await verifyGoogleToken(bearer)
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Token verification failed"
              throw new UnauthorizedError(message)
            }

            const { text } = body as { text?: string }

            if (!text?.trim()) {
              throw new BadRequestError("Vui lòng nhập nội dung")
            }
            if (text.length > 2000) {
              throw new BadRequestError("Nội dung quá dài (tối đa 2000 ký tự)")
            }

            const message = await this.createMessageUseCase.execute({
              sub: user.sub,
              name: user.name,
              isAdmin: user.isAdmin,
              text: text.trim(),
            })

            return ResponseDto.success({ item: message })
          },
          {
            body: t.Object({
              text: t.Optional(t.String()),
            }),
          }
        )
        .post("/messages/:id/heart", async ({ params, body }) => {
          const { sub } = body as { sub?: string }
          if (!sub) {
            throw new BadRequestError("Missing sub")
          }

          const updated = await this.heartMessageUseCase.execute(params.id, sub)
          if (!updated) {
            throw new BadRequestError("Message not found or already hearted")
          }

          return ResponseDto.success({ item: updated })
        })
        .delete("/messages/:id", async ({ params, bearer }) => {
          if (!bearer || !verifyToken(bearer)) {
            throw new UnauthorizedError()
          }

          const deleted = await this.deleteMessageUseCase.execute(params.id)
          if (!deleted) {
            throw new BadRequestError("Message not found")
          }

          return ResponseDto.success({ deleted: true, id: params.id })
        })
    )
  }
}
