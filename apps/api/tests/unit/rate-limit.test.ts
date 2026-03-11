/**
 * Unit Tests for Rate Limiting
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Rate limiting function copied from index.ts
const chatRate = new Map<string, { windowStart: number; count: number }>()

function rateLimitChat(ip: string, rpm: number = 20): { ok: boolean; retryAfterSec?: number } {
  const WINDOW = 60_000
  const now = Date.now()

  const cur = chatRate.get(ip) || { windowStart: now, count: 0 }
  if (now - cur.windowStart >= WINDOW) {
    cur.windowStart = now
    cur.count = 0
  }
  cur.count++
  chatRate.set(ip, cur)

  if (cur.count > rpm) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((WINDOW - (now - cur.windowStart)) / 1000),
    }
  }
  return { ok: true }
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    chatRate.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rateLimitChat', () => {
    it('should allow first request', () => {
      const result = rateLimitChat('127.0.0.1')

      expect(result.ok).toBe(true)
      expect(result.retryAfterSec).toBeUndefined()
    })

    it('should allow requests up to the limit', () => {
      const ip = '192.168.1.1'
      const rpm = 5

      for (let i = 0; i < rpm; i++) {
        const result = rateLimitChat(ip, rpm)
        expect(result.ok).toBe(true)
      }
    })

    it('should block requests over the limit', () => {
      const ip = '192.168.1.2'
      const rpm = 3

      // Use up the limit
      for (let i = 0; i < rpm; i++) {
        rateLimitChat(ip, rpm)
      }

      // Next request should be blocked
      const result = rateLimitChat(ip, rpm)
      expect(result.ok).toBe(false)
      expect(result.retryAfterSec).toBeDefined()
      expect(result.retryAfterSec).toBeGreaterThan(0)
    })

    it('should track different IPs separately', () => {
      const ip1 = '10.0.0.1'
      const ip2 = '10.0.0.2'
      const rpm = 2

      // Use up limit for ip1
      rateLimitChat(ip1, rpm)
      rateLimitChat(ip1, rpm)
      expect(rateLimitChat(ip1, rpm).ok).toBe(false)

      // ip2 should still be allowed
      expect(rateLimitChat(ip2, rpm).ok).toBe(true)
      expect(rateLimitChat(ip2, rpm).ok).toBe(true)
      expect(rateLimitChat(ip2, rpm).ok).toBe(false)
    })

    it('should reset count after window expires', () => {
      const ip = '10.0.0.3'
      const rpm = 2

      // Use up limit
      rateLimitChat(ip, rpm)
      rateLimitChat(ip, rpm)
      expect(rateLimitChat(ip, rpm).ok).toBe(false)

      // Advance time past window
      vi.advanceTimersByTime(61_000)

      // Should be allowed again
      expect(rateLimitChat(ip, rpm).ok).toBe(true)
    })

    it('should calculate retryAfter correctly', () => {
      const ip = '10.0.0.4'
      const rpm = 1

      // First request uses the limit
      rateLimitChat(ip, rpm)

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30_000)

      // Second request should be blocked with ~30 seconds retry
      const result = rateLimitChat(ip, rpm)
      expect(result.ok).toBe(false)
      expect(result.retryAfterSec).toBeLessThanOrEqual(30)
      expect(result.retryAfterSec).toBeGreaterThan(0)
    })

    it('should handle concurrent-like scenarios', () => {
      const ip = '10.0.0.5'
      const rpm = 10

      // Simulate rapid requests
      const results = []
      for (let i = 0; i < 15; i++) {
        results.push(rateLimitChat(ip, rpm))
      }

      const allowed = results.filter((r) => r.ok).length
      const blocked = results.filter((r) => !r.ok).length

      expect(allowed).toBe(rpm)
      expect(blocked).toBe(5)
    })
  })
})
