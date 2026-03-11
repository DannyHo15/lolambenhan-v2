/**
 * Unit Tests for JWT Service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JwtService, ROLE_PERMISSIONS, type UserRole, type Permission } from '../../src/modules/auth/auth.service'

// Set test environment
process.env.JWT_SECRET = 'test-jwt-secret-key-32-chars'
process.env.JWT_EXPIRES_IN = '3600'

describe('JwtService', () => {
  const testUser = {
    id: 'user-001',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'doctor',
    username: 'testuser',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    department: null,
    lastLoginAt: null,
  }

  describe('encodeBase64Url / decodeBase64Url', () => {
    it('should encode string to base64url format', () => {
      const input = '{"test":"data"}'
      const encoded = JwtService.encodeBase64Url(input)

      expect(encoded).not.toContain('+')
      expect(encoded).not.toContain('/')
      expect(encoded).not.toContain('=')
    })

    it('should decode base64url string back to original', () => {
      const input = '{"test":"data"}'
      const encoded = JwtService.encodeBase64Url(input)
      const decoded = JwtService.decodeBase64Url(encoded)

      expect(decoded).toBe(input)
    })

    it('should handle special characters', () => {
      const input = '{"name":"Nguyễn Văn A"}'
      const encoded = JwtService.encodeBase64Url(input)
      const decoded = JwtService.decodeBase64Url(encoded)

      expect(decoded).toBe(input)
    })
  })

  describe('sign', () => {
    it('should create a valid JWT format', () => {
      const payload = { sub: '123', email: 'test@test.com' }
      const token = JwtService.sign(payload)

      const parts = token.split('.')
      expect(parts.length).toBe(3)
    })

    it('should create unique tokens for different payloads', () => {
      const token1 = JwtService.sign({ sub: '1' })
      const token2 = JwtService.sign({ sub: '2' })

      expect(token1).not.toBe(token2)
    })

    it('should include header with alg HS256', () => {
      const token = JwtService.sign({ sub: '123' })
      const [headerB64] = token.split('.')
      const header = JSON.parse(JwtService.decodeBase64Url(headerB64))

      expect(header.alg).toBe('HS256')
      expect(header.typ).toBe('JWT')
    })
  })

  describe('verify', () => {
    it('should verify a valid token', () => {
      const payload = {
        sub: 'user-001',
        email: 'test@example.com',
        role: 'doctor',
        name: 'Test User',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
      const token = JwtService.sign(payload)

      const result = JwtService.verify(token)

      expect(result).not.toBeNull()
      expect(result?.sub).toBe('user-001')
      expect(result?.email).toBe('test@example.com')
    })

    it('should reject invalid token format', () => {
      expect(JwtService.verify('invalid')).toBeNull()
      expect(JwtService.verify('a.b')).toBeNull()
      expect(JwtService.verify('a.b.c.d')).toBeNull()
    })

    it('should reject token with wrong signature', () => {
      const payload = { sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 }
      const token = JwtService.sign(payload)
      const [header, body] = token.split('.')
      const tamperedToken = `${header}.${body}.wrongsignature`

      expect(JwtService.verify(tamperedToken)).toBeNull()
    })

    it('should reject expired token', () => {
      const payload = {
        sub: 'user-001',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      }
      const token = JwtService.sign(payload)

      expect(JwtService.verify(token)).toBeNull()
    })

    it('should accept token that expires in the future', () => {
      const payload = {
        sub: 'user-001',
        exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      }
      const token = JwtService.sign(payload)

      expect(JwtService.verify(token)).not.toBeNull()
    })

    it('should reject empty token', () => {
      expect(JwtService.verify('')).toBeNull()
    })

    it('should reject malformed base64', () => {
      expect(JwtService.verify('not.valid!!!.base64')).toBeNull()
    })
  })

  describe('generateAccessToken', () => {
    it('should generate token with user info', () => {
      const token = JwtService.generateAccessToken(testUser as any)
      const payload = JwtService.verify(token)

      expect(payload?.sub).toBe(testUser.id)
      expect(payload?.email).toBe(testUser.email)
      expect(payload?.role).toBe(testUser.role)
      expect(payload?.name).toBe(testUser.fullName)
    })

    it('should include iat and exp claims', () => {
      const token = JwtService.generateAccessToken(testUser as any)
      const payload = JwtService.verify(token)

      expect(payload?.iat).toBeDefined()
      expect(payload?.exp).toBeDefined()
      expect(payload?.exp).toBeGreaterThan(payload?.iat!)
    })

    it('should set correct expiration time', () => {
      const token = JwtService.generateAccessToken(testUser as any)
      const payload = JwtService.verify(token)
      const expectedExp = payload?.iat! + 3600 // JWT_EXPIRES_IN

      expect(payload?.exp).toBe(expectedExp)
    })
  })

  describe('createSignature', () => {
    it('should create consistent signatures for same input', () => {
      const data = 'test-data'
      const sig1 = JwtService.createSignature(data)
      const sig2 = JwtService.createSignature(data)

      expect(sig1).toBe(sig2)
    })

    it('should create different signatures for different inputs', () => {
      const sig1 = JwtService.createSignature('data1')
      const sig2 = JwtService.createSignature('data2')

      expect(sig1).not.toBe(sig2)
    })
  })
})

describe('ROLE_PERMISSIONS', () => {
  it('should have permissions for all roles', () => {
    const roles: UserRole[] = ['admin', 'doctor', 'student', 'guest']

    roles.forEach((role) => {
      expect(ROLE_PERMISSIONS[role]).toBeDefined()
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true)
    })
  })

  it('should give admin all permissions', () => {
    const adminPermissions = ROLE_PERMISSIONS.admin

    expect(adminPermissions).toContain('forms:view')
    expect(adminPermissions).toContain('forms:create')
    expect(adminPermissions).toContain('forms:delete')
    expect(adminPermissions).toContain('users:view')
    expect(adminPermissions).toContain('users:delete')
    expect(adminPermissions).toContain('templates:create')
  })

  it('should give doctor limited permissions', () => {
    const doctorPermissions = ROLE_PERMISSIONS.doctor

    expect(doctorPermissions).toContain('forms:view')
    expect(doctorPermissions).toContain('forms:create')
    expect(doctorPermissions).toContain('submissions:review')
    expect(doctorPermissions).not.toContain('users:delete')
    expect(doctorPermissions).not.toContain('templates:delete')
  })

  it('should give student minimal permissions', () => {
    const studentPermissions = ROLE_PERMISSIONS.student

    expect(studentPermissions).toContain('forms:view')
    expect(studentPermissions).toContain('forms:create')
    expect(studentPermissions).not.toContain('forms:delete')
    expect(studentPermissions).not.toContain('users:view')
  })

  it('should give guest read-only permissions', () => {
    const guestPermissions = ROLE_PERMISSIONS.guest

    expect(guestPermissions).toContain('forms:view')
    expect(guestPermissions).toContain('templates:view')
    expect(guestPermissions).toContain('submissions:view')
    expect(guestPermissions).not.toContain('forms:create')
    expect(guestPermissions).not.toContain('users:view')
  })

  it('should have hierarchical permission structure', () => {
    // Admin > Doctor > Student > Guest
    expect(ROLE_PERMISSIONS.admin.length).toBeGreaterThan(ROLE_PERMISSIONS.doctor.length)
    expect(ROLE_PERMISSIONS.doctor.length).toBeGreaterThanOrEqual(ROLE_PERMISSIONS.student.length)
    expect(ROLE_PERMISSIONS.student.length).toBeGreaterThan(ROLE_PERMISSIONS.guest.length)
  })
})
