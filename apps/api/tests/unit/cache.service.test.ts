/**
 * Unit Tests for Cache Service
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock environment variables
vi.stubEnv('CACHE_ENABLED', 'true')
vi.stubEnv('CACHE_TTL', '3600')
delete process.env.REDIS_URL // Force memory cache for tests

// Import after mocking environment
import { CacheService, CacheKeys, cache } from '../../src/infrastructure/cache/cache.service'

describe('CacheService', () => {
  let cacheService: CacheService

  beforeEach(async () => {
    // Reset singleton for each test
    if (cacheService) {
      await cacheService.destroy()
    }
    // Create fresh instance
    cacheService = CacheService.getInstance()
    await cacheService.clear()
  })

  afterEach(async () => {
    if (cacheService) {
      await cacheService.clear()
    }
  })

  describe('get / set', () => {
    it('should set and get a value', async () => {
      await cacheService.set('test-key', { data: 'test' })
      const result = await cacheService.get<{ data: string }>('test-key')

      expect(result).toEqual({ data: 'test' })
    })

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent')

      expect(result).toBeNull()
    })

    it('should handle different data types', async () => {
      // String
      await cacheService.set('string-key', 'hello')
      expect(await cacheService.get<string>('string-key')).toBe('hello')

      // Number
      await cacheService.set('number-key', 42)
      expect(await cacheService.get<number>('number-key')).toBe(42)

      // Array
      await cacheService.set('array-key', [1, 2, 3])
      expect(await cacheService.get<number[]>('array-key')).toEqual([1, 2, 3])

      // Object
      const obj = { name: 'test', nested: { value: 123 } }
      await cacheService.set('object-key', obj)
      expect(await cacheService.get<typeof obj>('object-key')).toEqual(obj)
    })

    it('should handle null values', async () => {
      await cacheService.set('null-key', null)
      // Note: null is treated as "not found" in get
      const result = await cacheService.get('null-key')

      expect(result).toBeNull()
    })
  })

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      await cacheService.set('cached-key', { value: 'cached' })

      const fn = vi.fn().mockResolvedValue({ value: 'fresh' })
      const result = await cacheService.getOrSet('cached-key', fn)

      expect(result).toEqual({ value: 'cached' })
      expect(fn).not.toHaveBeenCalled()
    })

    it('should call function and cache result if not exists', async () => {
      const fn = vi.fn().mockResolvedValue({ value: 'fresh' })
      const result = await cacheService.getOrSet('new-key', fn)

      expect(result).toEqual({ value: 'fresh' })
      expect(fn).toHaveBeenCalledTimes(1)

      // Verify cached
      const cached = await cacheService.get<{ value: string }>('new-key')
      expect(cached).toEqual({ value: 'fresh' })
    })

    it('should use custom TTL', async () => {
      const fn = vi.fn().mockResolvedValue({ data: 'test' })
      await cacheService.getOrSet('ttl-key', fn, 60)

      expect(fn).toHaveBeenCalled()
    })

    it('should handle async functions', async () => {
      const asyncFn = async () => {
        await new Promise((r) => setTimeout(r, 10))
        return { async: true }
      }

      const result = await cacheService.getOrSet('async-key', asyncFn)
      expect(result).toEqual({ async: true })
    })
  })

  describe('delete', () => {
    it('should delete a key', async () => {
      await cacheService.set('delete-me', { data: 'test' })

      const deleted = await cacheService.delete('delete-me')
      expect(deleted).toBe(true)

      const result = await cacheService.get('delete-me')
      expect(result).toBeNull()
    })

    it('should return false for non-existent key', async () => {
      const deleted = await cacheService.delete('non-existent')
      expect(deleted).toBe(false)
    })
  })

  describe('deletePattern', () => {
    it('should delete keys matching pattern', async () => {
      await cacheService.set('template:1', { id: 1 })
      await cacheService.set('template:2', { id: 2 })
      await cacheService.set('template:3', { id: 3 })
      await cacheService.set('other:1', { id: 'other' })

      const count = await cacheService.deletePattern('template:*')

      expect(count).toBe(3)
      expect(await cacheService.get('template:1')).toBeNull()
      expect(await cacheService.get('template:2')).toBeNull()
      expect(await cacheService.get('template:3')).toBeNull()
      expect(await cacheService.get('other:1')).not.toBeNull()
    })

    it('should return 0 for no matches', async () => {
      const count = await cacheService.deletePattern('nonexistent:*')
      expect(count).toBe(0)
    })
  })

  describe('invalidateTemplate', () => {
    it('should invalidate template and related caches', async () => {
      await cacheService.set('template:test-1', { id: 'test-1' })
      await cacheService.set('template:specialty:noi-khoa', { specialty: 'noi-khoa' })
      await cacheService.set('templates:list:{"status":"active"}', [{ id: '1' }])

      await cacheService.invalidateTemplate('test-1', 'noi-khoa')

      expect(await cacheService.get('template:test-1')).toBeNull()
      expect(await cacheService.get('template:specialty:noi-khoa')).toBeNull()
      expect(await cacheService.get('templates:list:{"status":"active"}')).toBeNull()
    })
  })

  describe('invalidateSubmission', () => {
    it('should invalidate submission and related caches', async () => {
      await cacheService.set('submission:sub-1', { id: 'sub-1' })
      await cacheService.set('submission:sub-1:history', [{ action: 'created' }])
      await cacheService.set('submissions:list:{"status":"draft"}', [{ id: 'sub-1' }])
      await cacheService.set('stats:forms', { total: 10 })

      await cacheService.invalidateSubmission('sub-1')

      expect(await cacheService.get('submission:sub-1')).toBeNull()
      expect(await cacheService.get('submission:sub-1:history')).toBeNull()
      expect(await cacheService.get('submissions:list:{"status":"draft"}')).toBeNull()
      expect(await cacheService.get('stats:forms')).toBeNull()
    })
  })

  describe('invalidateUser', () => {
    it('should invalidate user caches', async () => {
      await cacheService.set('user:user-1', { id: 'user-1' })
      await cacheService.set('user:user-1:permissions', ['forms:view'])

      await cacheService.invalidateUser('user-1')

      expect(await cacheService.get('user:user-1')).toBeNull()
      expect(await cacheService.get('user:user-1:permissions')).toBeNull()
    })
  })

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      await cacheService.set('key1', 'value1')
      await cacheService.set('key2', 'value2')
      await cacheService.set('key3', 'value3')

      await cacheService.clear()

      expect(await cacheService.get('key1')).toBeNull()
      expect(await cacheService.get('key2')).toBeNull()
      expect(await cacheService.get('key3')).toBeNull()
    })
  })

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await cacheService.set('stat-key-1', 'value1')
      await cacheService.set('stat-key-2', 'value2')

      const stats = await cacheService.getStats()

      expect(stats.type).toBe('memory')
      expect(stats.keys).toBe(2)
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CacheService.getInstance()
      const instance2 = CacheService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should create new instance after destroy', async () => {
      const instance1 = CacheService.getInstance()
      await instance1.destroy()

      const instance2 = CacheService.getInstance()

      expect(instance1).not.toBe(instance2)
    })
  })
})

describe('CacheKeys', () => {
  it('should generate template key', () => {
    expect(CacheKeys.template('template-1')).toBe('template:template-1')
  })

  it('should generate template by specialty key', () => {
    expect(CacheKeys.templateBySpecialty('noi-khoa')).toBe('template:specialty:noi-khoa')
  })

  it('should generate templates list key', () => {
    const filters = { status: 'active', limit: 10 }
    expect(CacheKeys.templatesList(filters)).toBe(`templates:list:${JSON.stringify(filters)}`)
  })

  it('should generate submission key', () => {
    expect(CacheKeys.submission('sub-1')).toBe('submission:sub-1')
  })

  it('should generate submission history key', () => {
    expect(CacheKeys.submissionHistory('sub-1')).toBe('submission:sub-1:history')
  })

  it('should generate user key', () => {
    expect(CacheKeys.user('user-1')).toBe('user:user-1')
  })

  it('should generate user permissions key', () => {
    expect(CacheKeys.userPermissions('user-1')).toBe('user:user-1:permissions')
  })

  it('should generate form stats key without templateId', () => {
    expect(CacheKeys.formStats()).toBe('stats:forms')
  })

  it('should generate form stats key with templateId', () => {
    expect(CacheKeys.formStats('template-1')).toBe('stats:forms:template-1')
  })

  it('should generate rate limit key', () => {
    expect(CacheKeys.rateLimit('192.168.1.1', 'chat')).toBe('ratelimit:chat:192.168.1.1')
  })
})
