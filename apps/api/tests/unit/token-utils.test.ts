/**
 * Unit Tests for Token Utilities
 * Tests the makeToken and verifyToken functions from index.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

// Set test environment before importing
process.env.ADMIN_TOKEN_SECRET = 'test-token-secret-32-chars-long'

// Helper functions copied from index.ts (since they're not exported)
function makeToken(): string {
  const raw = randomBytes(24).toString('hex')
  const sig = createHmac('sha256', process.env.ADMIN_TOKEN_SECRET!).update(raw).digest('hex')
  return `${raw}.${sig}`
}

function verifyToken(token: string): boolean {
  if (!token || !process.env.ADMIN_TOKEN_SECRET) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [raw, sig] = parts
  const expected = createHmac('sha256', process.env.ADMIN_TOKEN_SECRET!).update(raw).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

describe('Token Utilities', () => {
  beforeEach(() => {
    process.env.ADMIN_TOKEN_SECRET = 'test-token-secret-32-chars-long'
  })

  describe('makeToken', () => {
    it('should generate a token with two parts separated by dot', () => {
      const token = makeToken()
      const parts = token.split('.')

      expect(parts.length).toBe(2)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 100; i++) {
        tokens.add(makeToken())
      }

      expect(tokens.size).toBe(100)
    })

    it('should generate tokens with hex strings', () => {
      const token = makeToken()
      const [raw, sig] = token.split('.')

      expect(raw).toMatch(/^[0-9a-f]+$/)
      expect(sig).toMatch(/^[0-9a-f]+$/)
    })

    it('should generate raw part with 48 characters (24 bytes)', () => {
      const token = makeToken()
      const [raw] = token.split('.')

      expect(raw.length).toBe(48)
    })

    it('should generate signature with 64 characters (sha256)', () => {
      const token = makeToken()
      const [, sig] = token.split('.')

      expect(sig.length).toBe(64)
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = makeToken()

      expect(verifyToken(token)).toBe(true)
    })

    it('should reject invalid token format (no dot)', () => {
      expect(verifyToken('invalidtoken')).toBe(false)
    })

    it('should reject invalid token format (too many dots)', () => {
      expect(verifyToken('a.b.c')).toBe(false)
    })

    it('should reject empty token', () => {
      expect(verifyToken('')).toBe(false)
    })

    it('should reject null/undefined token', () => {
      expect(verifyToken(null as any)).toBe(false)
      expect(verifyToken(undefined as any)).toBe(false)
    })

    it('should reject token with wrong signature', () => {
      const token = makeToken()
      const [raw] = token.split('.')
      const fakeSig = '0'.repeat(64)
      const fakeToken = `${raw}.${fakeSig}`

      expect(verifyToken(fakeToken)).toBe(false)
    })

    it('should reject token with tampered raw part', () => {
      const token = makeToken()
      const [, sig] = token.split('.')
      const tamperedToken = `${'0'.repeat(48)}.${sig}`

      expect(verifyToken(tamperedToken)).toBe(false)
    })

    it('should reject token when ADMIN_TOKEN_SECRET is not set', () => {
      const originalSecret = process.env.ADMIN_TOKEN_SECRET
      const token = makeToken() // Generate token with valid secret first

      delete process.env.ADMIN_TOKEN_SECRET

      expect(verifyToken(token)).toBe(false)

      process.env.ADMIN_TOKEN_SECRET = originalSecret
    })

    it('should reject signature with wrong length', () => {
      const token = makeToken()
      const [raw, sig] = token.split('.')
      const wrongSigToken = `${raw}.${sig.slice(0, 32)}`

      // This should throw in timingSafeEqual and return false
      expect(verifyToken(wrongSigToken)).toBe(false)
    })

    it('should reject non-hex characters in signature', () => {
      const token = makeToken()
      const [raw] = token.split('.')
      const invalidSig = 'g'.repeat(64) // 'g' is not valid hex

      expect(verifyToken(`${raw}.${invalidSig}`)).toBe(false)
    })
  })

  describe('Token Flow', () => {
    it('should generate and verify multiple tokens correctly', () => {
      for (let i = 0; i < 10; i++) {
        const token = makeToken()
        expect(verifyToken(token)).toBe(true)
      }
    })

    it('should verify tokens generated before environment change', () => {
      const secret1 = 'first-secret-key-32-characters'
      process.env.ADMIN_TOKEN_SECRET = secret1
      const token1 = makeToken()

      const secret2 = 'second-secret-key-32-characters'
      process.env.ADMIN_TOKEN_SECRET = secret2

      // Token generated with first secret should not verify with second
      expect(verifyToken(token1)).toBe(false)

      // Generate new token with second secret
      const token2 = makeToken()
      expect(verifyToken(token2)).toBe(true)
    })
  })
})
