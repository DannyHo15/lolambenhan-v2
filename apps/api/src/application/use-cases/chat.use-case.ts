/**
 * Chat Use Cases
 * Contains business logic for AI chat operations
 */
import type { ChatMessage, ChatResponse } from "../../domain/entities/chat.entity"

export interface IChatProvider {
  chat(messages: ChatMessage[]): Promise<ChatResponse>
}

export class ChatUseCase {
  constructor(private readonly chatProvider: IChatProvider) {}

  async execute(messages: ChatMessage[]): Promise<ChatResponse> {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Messages must be a non-empty array")
    }

    return this.chatProvider.chat(messages)
  }
}
