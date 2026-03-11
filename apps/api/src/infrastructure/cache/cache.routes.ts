/**
 * Cache Management Routes
 * Admin-only routes for cache management
 */
import { Elysia, t } from "elysia"
import { ResponseDto, UnauthorizedError } from "../../shared/response.dto"
import { cache } from "./cache.service"
import { requireRole } from "../../modules/auth/auth.routes"

/**
 * Cache Routes - Admin only
 */
export const cacheRoutes = new Elysia({ prefix: "/cache" })
  .use(requireRole("admin"))
  // ============================================
  // GET CACHE STATS
  // ============================================
  .get(
    "/stats",
    async () => {
      const stats = await cache.getStats()
      return ResponseDto.success(stats)
    },
    {
      detail: {
        summary: "Get cache statistics",
        description: "Get cache statistics including type, keys count, and memory usage (admin only)",
      },
    }
  )

  // ============================================
  // CLEAR ALL CACHE
  // ============================================
  .post(
    "/clear",
    async () => {
      await cache.clear()
      return ResponseDto.success({ cleared: true }, "Cache cleared successfully")
    },
    {
      detail: {
        summary: "Clear all cache",
        description: "Clear all cached data (admin only)",
      },
    }
  )

  // ============================================
  // INVALIDATE TEMPLATES CACHE
  // ============================================
  .post(
    "/invalidate/templates",
    async () => {
      const count = await cache.deletePattern("template:*")
      await cache.deletePattern("templates:*")
      return ResponseDto.success({ invalidated: count }, "Templates cache invalidated")
    },
    {
      detail: {
        summary: "Invalidate templates cache",
        description: "Clear all cached template data (admin only)",
      },
    }
  )

  // ============================================
  // INVALIDATE SUBMISSIONS CACHE
  // ============================================
  .post(
    "/invalidate/submissions",
    async () => {
      const count = await cache.deletePattern("submission:*")
      await cache.deletePattern("submissions:*")
      await cache.deletePattern("stats:*")
      return ResponseDto.success({ invalidated: count }, "Submissions cache invalidated")
    },
    {
      detail: {
        summary: "Invalidate submissions cache",
        description: "Clear all cached submission data (admin only)",
      },
    }
  )

  // ============================================
  // INVALIDATE USER CACHE
  // ============================================
  .post(
    "/invalidate/users",
    async () => {
      const count = await cache.deletePattern("user:*")
      return ResponseDto.success({ invalidated: count }, "Users cache invalidated")
    },
    {
      detail: {
        summary: "Invalidate users cache",
        description: "Clear all cached user data (admin only)",
      },
    }
  )

  // ============================================
  // DELETE SPECIFIC KEY
  // ============================================
  .delete(
    "/:key",
    async ({ params }) => {
      const deleted = await cache.delete(params.key)
      return ResponseDto.success({ deleted, key: params.key })
    },
    {
      detail: {
        summary: "Delete cache key",
        description: "Delete a specific cache key (admin only)",
      },
    }
  )
