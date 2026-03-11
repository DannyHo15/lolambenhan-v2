/**
 * Admin Controller
 * Handles HTTP requests for admin endpoints
 */
import { Elysia, t } from "elysia"
import { ResponseDto, BadRequestError } from "../../../shared/response.dto"
import { generateToken, verifyToken, verifyPassword } from "../../../shared/auth.util"

export class AdminController {
  verifyToken = verifyToken

  registerRoutes(app: Elysia) {
    return app.post(
      "/admin/login",
      async ({ body }) => {
        const adminPassword = process.env.ADMIN_PASSWORD || ""
        const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET || ""

        if (!adminPassword || !adminTokenSecret) {
          throw new BadRequestError("Admin not configured")
        }

        const { password } = body as { password?: string }
        if (!verifyPassword(password || "")) {
          throw new BadRequestError("Sai mật khẩu")
        }

        const token = generateToken()
        return ResponseDto.success({ token })
      },
      {
        body: t.Object({
          password: t.String(),
        }),
      }
    )
  }
}
