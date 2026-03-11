/**
 * Shared Types & Utilities Package
 * Used by both frontend and backend
 */

// ====== Domain Types ======
export interface Comment {
  id: number
  username: string
  text: string
  heart: boolean
  createdAt: Date | string
  ip?: string
}

export interface HoichanMessage {
  id: string
  sub: string
  name: string
  isAdmin: boolean
  heart: boolean
  heartCount: number
  text: string
  fileName?: string
  fileMime?: string
  fileSize?: number
  fileUrl?: string
  filePublicId?: string
  fileResourceType?: string
  at: number
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

// ====== API Response Types ======
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
}

// ====== API Client ======
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/apis/v1"

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    return (await response.json()) as ApiResponse<T>
  }

  // Comments
  getComments() {
    return this.request<Comment[]>("/comments")
  }

  createComment(data: { username: string; text: string }) {
    return this.request<{ item: Comment }>("/comments", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Chat
  sendChat(messages: ChatMessage[]) {
    return this.request<{
      answer: string
      providerUsed: string
      modelUsed: string
    }>("/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    })
  }

  // Hoichan
  getHoichanMessages() {
    return this.request<HoichanMessage[]>("/hoichan/messages")
  }

  createHoichanMessage(data: {
    text: string
    sub: string
    name: string
    isAdmin?: boolean
  }) {
    return this.request<{ item: HoichanMessage }>("/hoichan/messages", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()
