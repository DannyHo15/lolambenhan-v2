/**
 * Cache Service
 * Provides caching capabilities with Redis or in-memory fallback
 */

// Cache configuration
const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false'
const CACHE_TTL = Number(process.env.CACHE_TTL || 3600) // 1 hour default
const REDIS_URL = process.env.REDIS_URL

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

/**
 * In-memory cache implementation (fallback when Redis is not available)
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: Timer | null = null

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data: value,
      expiresAt: Date.now() + ttl * 1000,
      createdAt: Date.now(),
    }
    this.cache.set(key, entry)
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }

  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    let count = 0
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async getStats(): Promise<{ keys: number; size: number }> {
    return {
      keys: this.cache.size,
      size: 0, // Accurate size calculation is expensive
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

/**
 * Redis cache implementation
 */
class RedisCache {
  private client: any = null
  private connected = false

  async connect(): Promise<void> {
    if (!REDIS_URL) {
      throw new Error('REDIS_URL is not configured')
    }

    try {
      // Dynamic import for Redis (optional dependency)
      const { createClient } = await import('redis')
      this.client = createClient({ url: REDIS_URL })

      this.client.on('error', (err: Error) => {
        console.error('[CacheService] Redis error:', err)
        this.connected = false
      })

      this.client.on('connect', () => {
        console.log('[CacheService] Redis connected')
        this.connected = true
      })

      await this.client.connect()
    } catch (error) {
      console.error('[CacheService] Failed to connect to Redis:', error)
      throw error
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) return null

    try {
      const value = await this.client.get(key)
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error) {
      console.error('[CacheService] Redis get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.connected || !this.client) return

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('[CacheService] Redis set error:', error)
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected || !this.client) return false

    try {
      const result = await this.client.del(key)
      return result > 0
    } catch (error) {
      console.error('[CacheService] Redis delete error:', error)
      return false
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.connected || !this.client) return 0

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0

      await this.client.del(keys)
      return keys.length
    } catch (error) {
      console.error('[CacheService] Redis deletePattern error:', error)
      return 0
    }
  }

  async clear(): Promise<void> {
    if (!this.connected || !this.client) return

    try {
      await this.client.flushDb()
    } catch (error) {
      console.error('[CacheService] Redis clear error:', error)
    }
  }

  async getStats(): Promise<{ keys: number; memory: string }> {
    if (!this.connected || !this.client) {
      return { keys: 0, memory: '0' }
    }

    try {
      const info = await this.client.info('memory')
      const dbSize = await this.client.dbSize()

      // Extract used_memory from info
      const memoryMatch = info.match(/used_memory_human:(\S+)/)
      const memory = memoryMatch ? memoryMatch[1] : '0'

      return { keys: dbSize, memory }
    } catch (error) {
      return { keys: 0, memory: '0' }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.connected = false
    }
  }
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  // Form templates
  template: (id: string) => `template:${id}`,
  templateBySpecialty: (specialty: string) => `template:specialty:${specialty}`,
  templatesList: (filters: Record<string, unknown>) => `templates:list:${JSON.stringify(filters)}`,

  // Form submissions
  submission: (id: string) => `submission:${id}`,
  submissionsList: (filters: Record<string, unknown>) => `submissions:list:${JSON.stringify(filters)}`,
  submissionHistory: (submissionId: string) => `submission:${submissionId}:history`,

  // User data
  user: (id: string) => `user:${id}`,
  userPermissions: (id: string) => `user:${id}:permissions`,

  // Stats
  formStats: (templateId?: string) => `stats:forms${templateId ? `:${templateId}` : ''}`,

  // Rate limiting
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${endpoint}:${ip}`,
}

/**
 * Cache Service - Main export
 */
export class CacheService {
  private static instance: CacheService | null = null
  private cache: MemoryCache | RedisCache
  private isRedis = false
  private defaultTTL: number

  private constructor() {
    this.defaultTTL = CACHE_TTL

    // Try to use Redis, fallback to memory cache
    if (REDIS_URL && CACHE_ENABLED) {
      this.cache = new RedisCache()
      this.isRedis = true
      // Connect asynchronously
      this.connectRedis()
    } else {
      this.cache = new MemoryCache()
      console.log('[CacheService] Using in-memory cache')
    }
  }

  private async connectRedis(): Promise<void> {
    try {
      await (this.cache as RedisCache).connect()
      console.log('[CacheService] Redis cache connected')
    } catch (error) {
      console.warn('[CacheService] Redis connection failed, falling back to memory cache')
      this.cache = new MemoryCache()
      this.isRedis = false
    }
  }

  static getInstance(): CacheService {
    if (!this.instance) {
      this.instance = new CacheService()
    }
    return this.instance
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!CACHE_ENABLED) return null

    try {
      return await this.cache.get<T>(key)
    } catch (error) {
      console.error(`[CacheService] Get error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!CACHE_ENABLED) return

    try {
      await this.cache.set(key, value, ttl ?? this.defaultTTL)
    } catch (error) {
      console.error(`[CacheService] Set error for key ${key}:`, error)
    }
  }

  /**
   * Get or set - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    if (!CACHE_ENABLED) {
      return fn()
    }

    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fn()
    await this.set(key, value, ttl)
    return value
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!CACHE_ENABLED) return false

    try {
      return await this.cache.delete(key)
    } catch (error) {
      console.error(`[CacheService] Delete error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!CACHE_ENABLED) return 0

    try {
      return await this.cache.deletePattern(pattern)
    } catch (error) {
      console.error(`[CacheService] DeletePattern error for ${pattern}:`, error)
      return 0
    }
  }

  /**
   * Invalidate cache for a template
   */
  async invalidateTemplate(id: string, specialty?: string): Promise<void> {
    await this.delete(CacheKeys.template(id))
    if (specialty) {
      await this.delete(CacheKeys.templateBySpecialty(specialty))
    }
    // Invalidate list caches
    await this.deletePattern('templates:list:*')
  }

  /**
   * Invalidate cache for a submission
   */
  async invalidateSubmission(id: string): Promise<void> {
    await this.delete(CacheKeys.submission(id))
    await this.delete(CacheKeys.submissionHistory(id))
    // Invalidate list caches
    await this.deletePattern('submissions:list:*')
    // Invalidate stats
    await this.deletePattern('stats:forms*')
  }

  /**
   * Invalidate cache for a user
   */
  async invalidateUser(id: string): Promise<void> {
    await this.delete(CacheKeys.user(id))
    await this.delete(CacheKeys.userPermissions(id))
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!CACHE_ENABLED) return

    try {
      await this.cache.clear()
    } catch (error) {
      console.error('[CacheService] Clear error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ type: string; keys: number; memory?: string }> {
    const stats = await this.cache.getStats()
    return {
      type: this.isRedis ? 'redis' : 'memory',
      ...stats,
    }
  }

  /**
   * Cleanup and disconnect
   */
  async destroy(): Promise<void> {
    if (this.isRedis) {
      await (this.cache as RedisCache).disconnect()
    } else {
      (this.cache as MemoryCache).destroy()
    }
    CacheService.instance = null
  }
}

// Export singleton instance
export const cache = CacheService.getInstance()
