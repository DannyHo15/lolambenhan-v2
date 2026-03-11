/**
 * Hoichan Message Repository Implementation
 * Implements IHoichanRepository using Drizzle ORM
 */
import { eq, desc } from "drizzle-orm"
import type { IHoichanRepository } from "../../../domain/repositories/hoichan-message.repository.interface"
import type { HoichanMessage, CreateHoichanMessageInput } from "../../../domain/entities/hoichan-message.entity"
import { getDb } from "../../../infrastructure/database/connection"
import { hoichanMessages } from "../../../infrastructure/database/schema"

export class HoichanMessageRepositoryImpl implements IHoichanRepository {
  async findLatest(limit: number = 50): Promise<HoichanMessage[]> {
    const db = getDb()
    const rows = await db
      .select()
      .from(hoichanMessages)
      .orderBy(desc(hoichanMessages.at))
      .limit(limit)

    return rows.map((row) => ({
      id: row.id,
      sub: row.sub,
      name: row.name,
      isAdmin: row.isAdmin,
      heart: row.heart,
      heartCount: row.heartCount,
      text: row.text,
      fileName: row.fileName ?? undefined,
      fileMime: row.fileMime ?? undefined,
      fileSize: row.fileSize ?? undefined,
      fileUrl: row.fileUrl ?? undefined,
      filePublicId: row.filePublicId ?? undefined,
      fileResourceType: row.fileResourceType ?? undefined,
      at: row.at,
    }))
  }

  async create(input: CreateHoichanMessageInput): Promise<HoichanMessage> {
    const db = getDb()
    const id = crypto.randomUUID()
    const now = Date.now()

    const rows = await db
      .insert(hoichanMessages)
      .values({
        id,
        sub: input.sub,
        name: input.name,
        isAdmin: input.isAdmin ?? false,
        text: input.text ?? "",
        fileName: input.file?.name,
        fileMime: input.file?.mime,
        fileSize: input.file?.size,
        fileUrl: input.file?.url,
        filePublicId: input.file?.publicId,
        fileResourceType: input.file?.resourceType,
        at: now,
      })
      .returning()

    const row = rows[0]!
    return {
      id: row.id,
      sub: row.sub,
      name: row.name,
      isAdmin: row.isAdmin,
      heart: row.heart,
      heartCount: row.heartCount,
      text: row.text,
      fileName: row.fileName ?? undefined,
      fileMime: row.fileMime ?? undefined,
      fileSize: row.fileSize ?? undefined,
      fileUrl: row.fileUrl ?? undefined,
      filePublicId: row.filePublicId ?? undefined,
      fileResourceType: row.fileResourceType ?? undefined,
      at: row.at,
    }
  }

  async findById(id: string): Promise<HoichanMessage | null> {
    const db = getDb()
    const rows = await db.select().from(hoichanMessages).where(eq(hoichanMessages.id, id)).limit(1)
    if (!rows[0]) return null

    const row = rows[0]
    return {
      id: row.id,
      sub: row.sub,
      name: row.name,
      isAdmin: row.isAdmin,
      heart: row.heart,
      heartCount: row.heartCount,
      text: row.text,
      fileName: row.fileName ?? undefined,
      fileMime: row.fileMime ?? undefined,
      fileSize: row.fileSize ?? undefined,
      fileUrl: row.fileUrl ?? undefined,
      filePublicId: row.filePublicId ?? undefined,
      fileResourceType: row.fileResourceType ?? undefined,
      at: row.at,
    }
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb()
    const rows = await db.delete(hoichanMessages).where(eq(hoichanMessages.id, id)).returning()
    return rows.length > 0
  }

  async incrementHeart(id: string, excludeSub: string): Promise<HoichanMessage | null> {
    const db = getDb()
    const message = await this.findById(id)
    if (!message) return null

    const rows = await db
      .update(hoichanMessages)
      .set({
        heart: true,
        heartCount: message.heartCount + 1,
      })
      .where(eq(hoichanMessages.id, id))
      .returning()

    if (!rows[0]) return null

    const row = rows[0]
    return {
      id: row.id,
      sub: row.sub,
      name: row.name,
      isAdmin: row.isAdmin,
      heart: row.heart,
      heartCount: row.heartCount,
      text: row.text,
      fileName: row.fileName ?? undefined,
      fileMime: row.fileMime ?? undefined,
      fileSize: row.fileSize ?? undefined,
      fileUrl: row.fileUrl ?? undefined,
      filePublicId: row.filePublicId ?? undefined,
      fileResourceType: row.fileResourceType ?? undefined,
      at: row.at,
    }
  }
}
