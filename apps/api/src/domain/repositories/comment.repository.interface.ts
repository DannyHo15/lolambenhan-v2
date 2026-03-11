/**
 * Comment Repository Interface (Port)
 * Defines contract - no implementation
 */
import type { Comment, CreateCommentInput } from "../entities/comment.entity"

export interface ICommentRepository {
  findAll(limit?: number): Promise<Comment[]>
  create(input: CreateCommentInput): Promise<Comment>
  findById(id: number): Promise<Comment | null>
  toggleHeart(id: number): Promise<Comment | null>
  delete(id: number): Promise<boolean>
  countByIp(ip: string, days: number): Promise<number>
  findLastByIp(ip: string): Promise<Comment | null>
}
