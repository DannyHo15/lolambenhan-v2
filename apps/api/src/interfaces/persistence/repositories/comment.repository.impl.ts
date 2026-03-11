/**
 * Comment Repository Implementation
 * Implements ICommentRepository using Drizzle ORM
 */
import { eq, desc, gt, and } from "drizzle-orm"
import type { ICommentRepository } from "../../../domain/repositories/comment.repository.interface"
import type { Comment, CreateCommentInput } from "../../../domain/entities/comment.entity"
import { getDb } from "../../../infrastructure/database/connection"
import { comments } from "../../../infrastructure/database/schema"

export class CommentRepositoryImpl implements ICommentRepository {
  async findAll(limit: number = 200): Promise<Comment[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: comments.id,
        username: comments.username,
        text: comments.text,
        heart: comments.heart,
        createdAt: comments.createdAt,
        ip: comments.ip,
      })
      .from(comments)
      .orderBy(desc(comments.id))
      .limit(limit)

    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      text: row.text,
      heart: row.heart,
      createdAt: row.createdAt,
      ip: row.ip ?? undefined,
    }))
  }

  async create(input: CreateCommentInput): Promise<Comment> {
    const db = getDb()
    const rows = await db
      .insert(comments)
      .values({
        username: input.username.slice(0, 50),
        text: input.text.slice(0, 1000),
        ip: input.ip,
      })
      .returning()

    const row = rows[0]!
    return {
      id: row.id,
      username: row.username,
      text: row.text,
      heart: row.heart,
      createdAt: row.createdAt,
      ip: row.ip ?? undefined,
    }
  }

  async findById(id: number): Promise<Comment | null> {
    const db = getDb()
    const rows = await db.select().from(comments).where(eq(comments.id, id)).limit(1)
    if (!rows[0]) return null

    const row = rows[0]
    return {
      id: row.id,
      username: row.username,
      text: row.text,
      heart: row.heart,
      createdAt: row.createdAt,
      ip: row.ip ?? undefined,
    }
  }

  async toggleHeart(id: number): Promise<Comment | null> {
    const db = getDb()
    const rows = await db
      .update(comments)
      .set({ heart: true })
      .where(eq(comments.id, id))
      .returning()

    if (!rows[0]) return null

    const row = rows[0]
    return {
      id: row.id,
      username: row.username,
      text: row.text,
      heart: row.heart,
      createdAt: row.createdAt,
      ip: row.ip ?? undefined,
    }
  }

  async delete(id: number): Promise<boolean> {
    const db = getDb()
    const rows = await db.delete(comments).where(eq(comments.id, id)).returning()
    return rows.length > 0
  }

  async countByIp(ip: string, days: number): Promise<number> {
    const db = getDb()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const rows = await db
      .select({ count: comments.id })
      .from(comments)
      .where(and(eq(comments.ip, ip), gt(comments.createdAt, cutoff)))

    return rows.length
  }

  async findLastByIp(ip: string): Promise<Comment | null> {
    const db = getDb()
    const rows = await db
      .select()
      .from(comments)
      .where(eq(comments.ip, ip))
      .orderBy(desc(comments.createdAt))
      .limit(1)

    if (!rows[0]) return null

    const row = rows[0]
    return {
      id: row.id,
      username: row.username,
      text: row.text,
      heart: row.heart,
      createdAt: row.createdAt,
      ip: row.ip ?? undefined,
    }
  }
}
