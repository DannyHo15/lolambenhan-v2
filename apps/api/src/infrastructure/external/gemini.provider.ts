/**
 * Gemini Chat Provider
 * External service adapter for Google Gemini AI
 */
import type { ChatMessage, ChatResponse } from "../../domain/entities/chat.entity"
import type { IChatProvider } from "../../application/use-cases/chat.use-case"

export class GeminiChatProvider implements IChatProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || ""
    this.model = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"

    if (!this.apiKey) {
      console.warn("[GeminiChatProvider] GEMINI_API_KEY is not set")
    }
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured")
    }

    // Convert messages to Gemini format
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return {
      answer,
      providerUsed: "gemini",
      modelUsed: this.model,
    }
  }
}
