/**
 * Comment Entity
 * Pure domain entity - no framework dependencies
 */
export interface Comment {
  id: number
  username: string
  text: string
  heart: boolean
  createdAt: Date
  ip?: string
}

export interface CreateCommentInput {
  username: string
  text: string
  ip?: string
}
