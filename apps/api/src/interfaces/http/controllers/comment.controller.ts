/**
 * Comment Controller
 * Handles HTTP requests for comment endpoints
 */
import { Elysia, t } from "elysia"
import { ResponseDto, BadRequestError, UnauthorizedError, RateLimitError } from "../../../shared/response.dto"
import {
  CreateCommentUseCase,
  GetCommentsUseCase,
  ToggleCommentHeartUseCase,
  DeleteCommentUseCase,
} from "../../../application/use-cases/comment.use-case"
import type { ICommentRepository } from "../../../domain/repositories/comment.repository.interface"

export class CommentController {
  private createCommentUseCase: CreateCommentUseCase
  private getCommentsUseCase: GetCommentsUseCase
  private toggleHeartUseCase: ToggleCommentHeartUseCase
  private deleteCommentUseCase: DeleteCommentUseCase

  constructor(commentRepo: ICommentRepository) {
    this.createCommentUseCase = new CreateCommentUseCase(commentRepo)
    this.getCommentsUseCase = new GetCommentsUseCase(commentRepo)
    this.toggleHeartUseCase = new ToggleCommentHeartUseCase(commentRepo)
    this.deleteCommentUseCase = new DeleteCommentUseCase(commentRepo)
  }

  registerRoutes(app: ReturnType<typeof Elysia>, verifyToken: (token: string) => boolean) {
    return app.group("/comments", (app) =>
      app
        .get("/", async () => {
          const comments = await this.getCommentsUseCase.execute(200)
          return ResponseDto.success(comments)
        })
        .post(
          "/",
          async ({ body, request }) => {
            const ip =
              request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
              request.headers.get("x-real-ip") ||
              "unknown"

            const { username, text } = body as { username?: string; text?: string }

            if (!username?.trim()) {
              throw new BadRequestError("Vui lòng nhập nickname")
            }
            if (!text?.trim()) {
              throw new BadRequestError("Vui lòng nhập nội dung góp ý")
            }

            try {
              const comment = await this.createCommentUseCase.execute({
                username: username.trim(),
                text: text.trim(),
                ip,
              })
              return ResponseDto.success({ item: comment })
            } catch (error) {
              if (error instanceof Error) {
                if (error.message.includes("Rate limit")) {
                  throw new RateLimitError(undefined, { message: error.message })
                }
                if (error.message.includes("Cooldown")) {
                  throw new RateLimitError(30, { message: error.message })
                }
              }
              throw error
            }
          },
          {
            body: t.Object({
              username: t.String(),
              text: t.String(),
            }),
          }
        )
        .post("/:id/toggle-heart", async ({ params, bearer }) => {
          if (!bearer || !verifyToken(bearer)) {
            throw new UnauthorizedError()
          }

          const id = Number(params.id)
          if (!Number.isFinite(id)) {
            throw new BadRequestError("Invalid id")
          }

          const comment = await this.toggleHeartUseCase.execute(id)
          if (!comment) {
            throw new BadRequestError("Comment not found")
          }

          return ResponseDto.success({ item: comment })
        })
        .delete("/:id", async ({ params, bearer }) => {
          if (!bearer || !verifyToken(bearer)) {
            throw new UnauthorizedError()
          }

          const id = Number(params.id)
          if (!Number.isFinite(id)) {
            throw new BadRequestError("Invalid id")
          }

          const deleted = await this.deleteCommentUseCase.execute(id)
          if (!deleted) {
            throw new BadRequestError("Comment not found")
          }

          return ResponseDto.success({ deleted: true, id })
        })
    )
  }
}
