/**
 * Cache Mock - Mock cache service for unit tests
 */
import { vi } from 'vitest'

/**
 * Create a mock cache service
 */
export function createMockCache() {
  const store = new Map<string, { value: unknown; ttl: number }>()

  return {
    store,

    get: vi.fn(async <T>(key: string): Promise<T | null> => {
      const entry = store.get(key)
      return entry ? (entry.value as T) : null
    }),

    set: vi.fn(async <T>(key: string, value: T, ttl?: number): Promise<void> => {
      store.set(key, { value, ttl: ttl || 3600 })
    }),

    getOrSet: vi.fn(async <T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> => {
      const entry = store.get(key)
      if (entry) return entry.value as T

      const value = await fn()
      store.set(key, { value, ttl: ttl || 3600 })
      return value
    }),

    delete: vi.fn(async (key: string): Promise<boolean> => {
      return store.delete(key)
    }),

    deletePattern: vi.fn(async (pattern: string): Promise<number> => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      let count = 0
      for (const key of store.keys()) {
        if (regex.test(key)) {
          store.delete(key)
          count++
        }
      }
      return count
    }),

    clear: vi.fn(async (): Promise<void> => {
      store.clear()
    }),

    getStats: vi.fn(async () => ({
      type: 'mock',
      keys: store.size,
    })),

    invalidateTemplate: vi.fn(async (id: string, specialty?: string): Promise<void> => {
      store.delete(`template:${id}`)
      if (specialty) {
        store.delete(`template:specialty:${specialty}`)
      }
    }),

    invalidateSubmission: vi.fn(async (id: string): Promise<void> => {
      store.delete(`submission:${id}`)
      store.delete(`submission:${id}:history`)
    }),

    invalidateUser: vi.fn(async (id: string): Promise<void> => {
      store.delete(`user:${id}`)
      store.delete(`user:${id}:permissions`)
    }),

    destroy: vi.fn(async (): Promise<void> => {
      store.clear()
    }),
  }
}

/**
 * Mock cache instance for tests
 */
export const mockCache = createMockCache()

/**
 * Mock CacheKeys for tests
 */
export const mockCacheKeys = {
  template: (id: string) => `template:${id}`,
  templateBySpecialty: (specialty: string) => `template:specialty:${specialty}`,
  templatesList: (filters: Record<string, unknown>) => `templates:list:${JSON.stringify(filters)}`,
  submission: (id: string) => `submission:${id}`,
  submissionsList: (filters: Record<string, unknown>) => `submissions:list:${JSON.stringify(filters)}`,
  submissionHistory: (submissionId: string) => `submission:${submissionId}:history`,
  user: (id: string) => `user:${id}`,
  userPermissions: (id: string) => `user:${id}:permissions`,
  formStats: (templateId?: string) => `stats:forms${templateId ? `:${templateId}` : ''}`,
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${endpoint}:${ip}`,
}
