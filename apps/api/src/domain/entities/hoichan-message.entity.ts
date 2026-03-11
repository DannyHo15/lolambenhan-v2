/**
 * Hoichan (Discussion) Message Entity
 * Pure domain entity - no framework dependencies
 */
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

export interface CreateHoichanMessageInput {
  sub: string
  name: string
  isAdmin?: boolean
  text?: string
  file?: {
    name: string
    mime: string
    size: number
    url: string
    publicId: string
    resourceType: string
  }
}
