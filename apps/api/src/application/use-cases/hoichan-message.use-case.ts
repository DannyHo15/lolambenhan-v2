/**
 * Hoichan (Discussion) Message Use Cases
 * Contains business logic for discussion operations
 */
import type { IHoichanRepository } from "../../domain/repositories/hoichan-message.repository.interface"
import type { HoichanMessage, CreateHoichanMessageInput } from "../../domain/entities/hoichan-message.entity"

export class CreateHoichanMessageUseCase {
  constructor(private readonly hoichanRepo: IHoichanRepository) {}

  async execute(input: CreateHoichanMessageInput): Promise<HoichanMessage> {
    if (!input.text?.trim() && !input.file) {
      throw new Error("Message must have text or file attachment")
    }

    if (input.text && input.text.length > 2000) {
      throw new Error("Message text too long (max 2000 characters)")
    }

    return this.hoichanRepo.create(input)
  }
}

export class GetHoichanMessagesUseCase {
  constructor(private readonly hoichanRepo: IHoichanRepository) {}

  async execute(limit: number = 50): Promise<HoichanMessage[]> {
    const messages = await this.hoichanRepo.findLatest(limit)
    return messages.reverse() // Return in chronological order
  }
}

export class HeartHoichanMessageUseCase {
  constructor(private readonly hoichanRepo: IHoichanRepository) {}

  async execute(id: string, userSub: string): Promise<HoichanMessage | null> {
    return this.hoichanRepo.incrementHeart(id, userSub)
  }
}

export class DeleteHoichanMessageUseCase {
  constructor(private readonly hoichanRepo: IHoichanRepository) {}

  async execute(id: string): Promise<boolean> {
    return this.hoichanRepo.delete(id)
  }
}
