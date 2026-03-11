/**
 * Chat Controller
 * Handles HTTP requests for AI chat endpoint
 */
import { Elysia, t } from "elysia"
import { ResponseDto, BadRequestError, RateLimitError } from "../../../shared/response.dto"
import { ChatUseCase } from "../../../application/use-cases/chat.use-case"
import type { IChatProvider } from "../../../application/use-cases/chat.use-case"
import type { ChatMessage } from "../../../domain/entities/chat.entity"

// Rate limiting for chat
const chatRate = new Map<string, { windowStart: number; count: number }>()

function rateLimitChat(ip: string): { ok: boolean; retryAfterSec?: number } {
  const RPM = Number(process.env.CHAT_MAX_RPM || 20)
  const WINDOW = 60_000
  const now = Date.now()

  const cur = chatRate.get(ip) || { windowStart: now, count: 0 }
  if (now - cur.windowStart >= WINDOW) {
    cur.windowStart = now
    cur.count = 0
  }
  cur.count++
  chatRate.set(ip, cur)

  if (cur.count > RPM) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((WINDOW - (now - cur.windowStart)) / 1000),
    }
  }
  return { ok: true }
}

export class ChatController {
  private chatUseCase: ChatUseCase

  constructor(chatProvider: IChatProvider) {
    this.chatUseCase = new ChatUseCase(chatProvider)
  }

  registerRoutes(app: ReturnType<typeof Elysia>) {
    return app.post(
      "/chat",
      async ({ body, request }) => {
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          request.headers.get("x-real-ip") ||
          "unknown"

        const rl = rateLimitChat(ip)
        if (!rl.ok) {
          throw new RateLimitError(rl.retryAfterSec)
        }

        const { messages } = body as {
          messages?: Array<{ role: string; content: string }>
        }

        if (!Array.isArray(messages)) {
          throw new BadRequestError("messages must be an array")
        }

        const chatMessages: ChatMessage[] = messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }))

        const result = await this.chatUseCase.execute(chatMessages)
        return ResponseDto.success(result)
      },
      {
        body: t.Object({
          messages: t.Array(
            t.Object({
              role: t.String(),
              content: t.String(),
            })
          ),
        }),
      }
    )
  }
}
