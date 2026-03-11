/**
 * Upload Routes - File upload API endpoints
 */
import { Elysia, t } from "elysia"
import { UploadService, UploadResult } from "./upload.service"
import { ResponseDto, BadRequestError, UnauthorizedError } from "../../shared/response.dto"

export interface UploadBody {
  file: string // base64 encoded file
  filename: string
  mimeType?: string
  folder?: string
}

export const uploadRoutes = new Elysia({ prefix: "/upload" })
  /**
   * Upload a file (base64)
   * Requires authentication via Bearer token
   */
  .post(
    "/",
    async ({ body, bearer }) => {
      if (!bearer) {
        throw new UnauthorizedError("Authentication required")
      }

      const { file, filename, folder } = body as UploadBody

      if (!file || !filename) {
        throw new BadRequestError("file and filename are required")
      }

      // Validate base64 format
      if (!file.startsWith("data:") || !file.includes(";base64,")) {
        throw new BadRequestError("Invalid file format. Expected base64 data URI")
      }

      try {
        const result: UploadResult = await UploadService.uploadFromBase64(
          file,
          filename,
          { folder }
        )

        return ResponseDto.success({
          file: {
            publicId: result.publicId,
            url: result.url,
            secureUrl: result.secureUrl,
            resourceType: result.resourceType,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            mimeType: result.mimeType,
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed"
        throw new BadRequestError(message)
      }
    },
    {
      body: t.Object({
        file: t.String({ description: "Base64 encoded file data URI" }),
        filename: t.String({ description: "Original filename" }),
        folder: t.Optional(t.String({ description: "Upload folder in Cloudinary" })),
      }),
      detail: {
        summary: "Upload a file",
        description: "Upload a file to Cloudinary using base64 encoding",
        tags: ["upload"],
      },
    }
  )
  /**
   * Upload an image with automatic optimization
   */
  .post(
    "/image",
    async ({ body, bearer }) => {
      if (!bearer) {
        throw new UnauthorizedError("Authentication required")
      }

      const { file, filename, folder, maxWidth, maxHeight, quality } = body as UploadBody & {
        maxWidth?: number
        maxHeight?: number
        quality?: number
      }

      if (!file || !filename) {
        throw new BadRequestError("file and filename are required")
      }

      // Build transformation options
      const transformation: object[] = []
      if (maxWidth || maxHeight) {
        transformation.push({
          width: maxWidth,
          height: maxHeight,
          crop: "limit",
        })
      }
      if (quality) {
        transformation.push({ quality })
      }

      try {
        const result = await UploadService.uploadFromBase64(file, filename, {
          folder: folder || "lolambenhan/images",
          resourceType: "image",
          allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          transformation: transformation.length > 0 ? transformation : undefined,
        })

        // Generate thumbnail URL
        const thumbnailUrl = UploadService.getThumbnailUrl(result.publicId)

        return ResponseDto.success({
          file: {
            publicId: result.publicId,
            url: result.url,
            secureUrl: result.secureUrl,
            thumbnailUrl,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed"
        throw new BadRequestError(message)
      }
    },
    {
      body: t.Object({
        file: t.String(),
        filename: t.String(),
        folder: t.Optional(t.String()),
        maxWidth: t.Optional(t.Number()),
        maxHeight: t.Optional(t.Number()),
        quality: t.Optional(t.Number()),
      }),
      detail: {
        summary: "Upload an image",
        description: "Upload an image with optional optimization",
        tags: ["upload"],
      },
    }
  )
  /**
   * Delete a file
   */
  .delete(
    "/:publicId",
    async ({ params, bearer, body }) => {
      if (!bearer) {
        throw new UnauthorizedError("Authentication required")
      }

      const { resourceType } = body as { resourceType?: "image" | "video" | "raw" }
      const publicId = decodeURIComponent(params.publicId)

      const deleted = await UploadService.deleteFile(publicId, resourceType || "image")

      if (!deleted) {
        throw new BadRequestError("Failed to delete file or file not found")
      }

      return ResponseDto.success({ deleted: true, publicId })
    },
    {
      body: t.Object({
        resourceType: t.Optional(t.Union([t.Literal("image"), t.Literal("video"), t.Literal("raw")])),
      }),
      detail: {
        summary: "Delete a file",
        description: "Delete a file from Cloudinary by public ID",
        tags: ["upload"],
      },
    }
  )
  /**
   * Get file info
   */
  .get(
    "/:publicId/info",
    async ({ params, bearer }) => {
      if (!bearer) {
        throw new UnauthorizedError("Authentication required")
      }

      const publicId = decodeURIComponent(params.publicId)
      const info = await UploadService.getFileInfo(publicId)

      if (!info) {
        throw new BadRequestError("File not found")
      }

      return ResponseDto.success({ file: info })
    },
    {
      detail: {
        summary: "Get file info",
        description: "Get metadata about an uploaded file",
        tags: ["upload"],
      },
    }
  )
  /**
   * Get optimized URL
   */
  .get(
    "/:publicId/url",
    async ({ params, query }) => {
      const publicId = decodeURIComponent(params.publicId)
      const { width, height, quality } = query as { width?: number; height?: number; quality?: number }

      const url = UploadService.getOptimizedUrl(publicId, { width, height, quality })

      return ResponseDto.success({ url, publicId })
    },
    {
      query: t.Object({
        width: t.Optional(t.Number()),
        height: t.Optional(t.Number()),
        quality: t.Optional(t.Number()),
      }),
      detail: {
        summary: "Get optimized URL",
        description: "Generate an optimized URL for an image",
        tags: ["upload"],
      },
    }
  )
