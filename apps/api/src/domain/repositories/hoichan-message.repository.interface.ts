/**
 * Hoichan Message Repository Interface (Port)
 * Defines contract - no implementation
 */
import type { HoichanMessage, CreateHoichanMessageInput } from "../entities/hoichan-message.entity"

export interface IHoichanRepository {
  findLatest(limit?: number): Promise<HoichanMessage[]>
  create(input: CreateHoichanMessageInput): Promise<HoichanMessage>
  findById(id: string): Promise<HoichanMessage | null>
  delete(id: string): Promise<boolean>
  incrementHeart(id: string, excludeSub: string): Promise<HoichanMessage | null>
}
