/**
 * AI Chat Entity
 * Pure domain entity - no framework dependencies
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatResponse {
  answer: string
  providerUsed: string
  modelUsed: string
}
