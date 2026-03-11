/**
 * Cloudinary Upload Service
 * Handles file uploads to Cloudinary
 */
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export interface UploadResult {
  publicId: string
  url: string
  secureUrl: string
  resourceType: "image" | "video" | "raw" | "auto"
  format: string
  width?: number
  height?: number
  bytes: number
  originalFilename?: string
  mimeType?: string
}

export interface UploadOptions {
  folder?: string
  resourceType?: "image" | "video" | "raw" | "auto"
  maxSizeBytes?: number
  allowedMimeTypes?: string[]
  transformation?: object
  publicId?: string
  overwrite?: boolean
}

// Default limits
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export class UploadService {
  /**
   * Upload a file from base64 data
   */
  static async uploadFromBase64(
    base64Data: string,
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      folder = "lolambenhan/uploads",
      resourceType = "auto",
      maxSizeBytes = DEFAULT_MAX_SIZE,
      allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
      transformation,
      publicId,
      overwrite = false,
    } = options

    // Parse base64 data
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      throw new Error("Invalid base64 data format. Expected: data:mimetype;base64,data")
    }

    const mimeType = matches[1]
    const data = matches[2]

    // Validate MIME type
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
      throw new Error(`File type "${mimeType}" is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`)
    }

    // Validate size (base64 is ~33% larger than binary)
    const sizeInBytes = Math.ceil(data.length * 0.75)
    if (sizeInBytes > maxSizeBytes) {
      throw new Error(`File size (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB)`)
    }

    try {
      const uploadOptions: UploadApiOptions = {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        overwrite,
        use_filename: true,
        unique_filename: true,
        transformation: transformation as unknown as string,
      }

      const result: UploadApiResponse = await cloudinary.uploader.upload(
        `data:${mimeType};base64,${data}`,
        uploadOptions
      )

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        resourceType: result.resource_type as UploadResult["resourceType"],
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        originalFilename: filename,
        mimeType,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      throw new Error(`Cloudinary upload failed: ${message}`)
    }
  }

  /**
   * Upload a file from buffer
   */
  static async uploadFromBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      folder = "lolambenhan/uploads",
      resourceType = "auto",
      maxSizeBytes = DEFAULT_MAX_SIZE,
      allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
      transformation,
      publicId,
      overwrite = false,
    } = options

    // Validate MIME type
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
      throw new Error(`File type "${mimeType}" is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`)
    }

    // Validate size
    if (buffer.length > maxSizeBytes) {
      throw new Error(`File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB)`)
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: UploadApiOptions = {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        overwrite,
        use_filename: true,
        unique_filename: true,
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            reject(new Error(`Cloudinary upload failed: ${error?.message || "Unknown error"}`))
            return
          }

          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type as UploadResult["resourceType"],
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            originalFilename: filename,
            mimeType,
          })
        }
      )

      uploadStream.write(buffer)
      uploadStream.end()
    })
  }

  /**
   * Delete a file from Cloudinary
   */
  static async deleteFile(publicId: string, resourceType: "image" | "video" | "raw" = "image"): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      })
      return result.result === "ok"
    } catch (error) {
      console.error("[UploadService] Delete failed:", error)
      return false
    }
  }

  /**
   * Get file metadata
   */
  static async getFileInfo(publicId: string): Promise<object | null> {
    try {
      const result = await cloudinary.api.resource(publicId)
      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        createdAt: result.created_at,
      }
    } catch {
      return null
    }
  }

  /**
   * Generate thumbnail URL for images
   */
  static getThumbnailUrl(publicId: string, width = 150, height = 150): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: "fill",
      secure: true,
    })
  }

  /**
   * Generate optimized URL
   */
  static getOptimizedUrl(publicId: string, options: { width?: number; height?: number; quality?: number } = {}): string {
    return cloudinary.url(publicId, {
      width: options.width,
      height: options.height,
      quality: options.quality || "auto",
      fetch_format: "auto",
      secure: true,
    })
  }
}
