/**
 * Comment Use Cases
 * Contains business logic for comment operations
 */
import type { ICommentRepository } from "../../domain/repositories/comment.repository.interface"
import type { Comment, CreateCommentInput } from "../../domain/entities/comment.entity"

export class CreateCommentUseCase {
  constructor(private readonly commentRepo: ICommentRepository) {}

  async execute(input: CreateCommentInput & { ip: string }): Promise<Comment> {
    const RATE_LIMIT = 5
    const WINDOW_DAYS = 7
    const COOLDOWN_SECONDS = 30

    // Check rate limit
    const count = await this.commentRepo.countByIp(input.ip, WINDOW_DAYS)
    if (count >= RATE_LIMIT) {
      throw new Error("Rate limit exceeded: Too many comments in the past 7 days")
    }

    // Check cooldown
    const lastComment = await this.commentRepo.findLastByIp(input.ip)
    if (lastComment) {
      const elapsed = Date.now() - lastComment.createdAt.getTime()
      if (elapsed < COOLDOWN_SECONDS * 1000) {
        throw new Error(`Cooldown: Please wait ${COOLDOWN_SECONDS - Math.floor(elapsed / 1000)} seconds`)
      }
    }

    // Create comment
    return this.commentRepo.create({
      username: input.username.trim().slice(0, 50),
      text: input.text.trim().slice(0, 1000),
      ip: input.ip,
    })
  }
}

export class GetCommentsUseCase {
  constructor(private readonly commentRepo: ICommentRepository) {}

  async execute(limit: number = 200): Promise<Comment[]> {
    return this.commentRepo.findAll(limit)
  }
}

export class ToggleCommentHeartUseCase {
  constructor(private readonly commentRepo: ICommentRepository) {}

  async execute(id: number): Promise<Comment | null> {
    return this.commentRepo.toggleHeart(id)
  }
}

export class DeleteCommentUseCase {
  constructor(private readonly commentRepo: ICommentRepository) {}

  async execute(id: number): Promise<boolean> {
    return this.commentRepo.delete(id)
  }
}
