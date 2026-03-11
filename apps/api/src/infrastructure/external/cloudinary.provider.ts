/**
 * Cloudinary Upload Provider
 * External service adapter for file uploads
 */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary"

export interface UploadResult {
  publicId: string
  url: string
  secureUrl: string
  resourceType: string
  fileName: string
  mimeType: string
  size: number
}

export class CloudinaryUploadProvider {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }

  async uploadFile(
    file: Buffer,
    options: {
      fileName?: string
      mimeType?: string
      folder?: string
    } = {}
  ): Promise<UploadResult> {
    const folder = options.folder || process.env.CLOUDINARY_FOLDER || "uploads"

    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "auto",
            public_id: options.fileName?.replace(/\.[^/.]+$/, ""),
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result!)
          }
        )
        .end(file)
    })

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      resourceType: result.resource_type,
      fileName: options.fileName || result.public_id,
      mimeType: options.mimeType || "application/octet-stream",
      size: result.bytes,
    }
  }

  async deleteFile(publicId: string, resourceType: string = "image"): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType as "image" | "video" | "raw",
      })
      return result.result === "ok"
    } catch {
      return false
    }
  }
}
