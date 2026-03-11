/**
 * Unit Tests for UserService RBAC
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserService, ROLE_PERMISSIONS, type UserRole, type Permission } from '../../src/modules/auth/auth.service'

// Mock the database
vi.mock('../../src/infrastructure/database/connection', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{
          id: 'new-user-001',
          email: 'new@example.com',
          username: 'newuser_abc123',
          fullName: 'New User',
          role: 'student',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
  })),
}))

describe('UserService RBAC', () => {
  describe('hasPermission', () => {
    it('should return true when role has permission', () => {
      expect(UserService.hasPermission('admin', 'forms:view')).toBe(true)
      expect(UserService.hasPermission('admin', 'users:delete')).toBe(true)
      expect(UserService.hasPermission('doctor', 'forms:create')).toBe(true)
      expect(UserService.hasPermission('student', 'forms:view')).toBe(true)
    })

    it('should return false when role lacks permission', () => {
      expect(UserService.hasPermission('guest', 'forms:create')).toBe(false)
      expect(UserService.hasPermission('student', 'users:view')).toBe(false)
      expect(UserService.hasPermission('doctor', 'templates:delete')).toBe(false)
    })

    it('should handle all permissions correctly for each role', () => {
      const roles: UserRole[] = ['admin', 'doctor', 'student', 'guest']

      roles.forEach((role) => {
        const permissions = ROLE_PERMISSIONS[role]
        const allPermissions: Permission[] = [
          'forms:view', 'forms:create', 'forms:edit', 'forms:delete', 'forms:review',
          'templates:view', 'templates:create', 'templates:edit', 'templates:delete',
          'users:view', 'users:create', 'users:edit', 'users:delete',
          'submissions:view', 'submissions:create', 'submissions:edit', 'submissions:delete', 'submissions:review',
        ]

        allPermissions.forEach((permission) => {
          const hasPermission = UserService.hasPermission(role, permission)
          const shouldBeInRole = permissions.includes(permission)

          expect(hasPermission).toBe(shouldBeInRole)
        })
      })
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true when role has any of the permissions', () => {
      expect(
        UserService.hasAnyPermission('doctor', ['forms:view', 'users:delete'])
      ).toBe(true)

      expect(
        UserService.hasAnyPermission('student', ['users:delete', 'forms:view'])
      ).toBe(true)
    })

    it('should return false when role has none of the permissions', () => {
      expect(
        UserService.hasAnyPermission('guest', ['forms:create', 'users:view'])
      ).toBe(false)

      expect(
        UserService.hasAnyPermission('student', ['users:delete', 'templates:delete'])
      ).toBe(false)
    })

    it('should return false for empty permission array', () => {
      expect(UserService.hasAnyPermission('admin', [])).toBe(false)
    })

    it('should return true when role has all permissions', () => {
      expect(
        UserService.hasAnyPermission('admin', ['forms:view', 'forms:create', 'users:delete'])
      ).toBe(true)
    })
  })

  describe('generateUsername', () => {
    it('should generate username from email', () => {
      const username = UserService.generateUsername('test@example.com', 'Test User')

      expect(username).toMatch(/^test_[a-f0-9]{6}$/)
    })

    it('should handle special characters in email', () => {
      const username = UserService.generateUsername('test.user+123@example.com', 'Test')

      expect(username).toMatch(/^testuser123_[a-f0-9]{6}$/)
    })

    it('should generate unique usernames', () => {
      const usernames = new Set<string>()
      for (let i = 0; i < 100; i++) {
        usernames.add(UserService.generateUsername('same@example.com', 'Same'))
      }

      expect(usernames.size).toBe(100)
    })

    it('should lowercase the base', () => {
      const username = UserService.generateUsername('TestUser@Example.com', 'Test')

      expect(username).toMatch(/^testuser_[a-f0-9]{6}$/)
    })
  })

  describe('determineRole', () => {
    const originalEnv = process.env

    beforeEach(() => {
      vi.resetModules()
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should assign admin role for admin domains', () => {
      process.env.ADMIN_EMAIL_DOMAINS = 'admin.example.com,hospital.admin'

      expect(UserService.determineRole('user@admin.example.com')).toBe('admin')
      expect(UserService.determineRole('ceo@hospital.admin')).toBe('admin')
    })

    it('should assign doctor role for doctor domains', () => {
      process.env.DOCTOR_EMAIL_DOMAINS = 'doctor.example.com,hospital.com'

      expect(UserService.determineRole('user@doctor.example.com')).toBe('doctor')
      expect(UserService.determineRole('dr.smith@hospital.com')).toBe('doctor')
    })

    it('should default to student role', () => {
      expect(UserService.determineRole('user@gmail.com')).toBe('student')
      expect(UserService.determineRole('random@unknown.org')).toBe('student')
    })

    it('should prioritize admin over doctor', () => {
      process.env.ADMIN_EMAIL_DOMAINS = 'example.com'
      process.env.DOCTOR_EMAIL_DOMAINS = 'example.com'

      // Admin takes precedence
      expect(UserService.determineRole('user@example.com')).toBe('admin')
    })

    it('should handle case-insensitive email domains', () => {
      process.env.ADMIN_EMAIL_DOMAINS = 'admin.example.com'

      // Email domain is lowercased by the service
      expect(UserService.determineRole('user@ADMIN.EXAMPLE.COM')).toBe('admin')
      expect(UserService.determineRole('user@Admin.Example.Com')).toBe('admin')
    })

    it('should handle empty environment variables', () => {
      delete process.env.ADMIN_EMAIL_DOMAINS
      delete process.env.DOCTOR_EMAIL_DOMAINS

      expect(UserService.determineRole('user@any.com')).toBe('student')
    })
  })
})

describe('Permission Matrix', () => {
  it('should have correct permission matrix for forms', () => {
    const formsPermissions: Record<UserRole, { view: boolean; create: boolean; edit: boolean; delete: boolean; review: boolean }> = {
      admin: { view: true, create: true, edit: true, delete: true, review: true },
      doctor: { view: true, create: true, edit: true, delete: false, review: false },
      student: { view: true, create: true, edit: false, delete: false, review: false },
      guest: { view: true, create: false, edit: false, delete: false, review: false },
    }

    Object.entries(formsPermissions).forEach(([role, expected]) => {
      expect(UserService.hasPermission(role as UserRole, 'forms:view')).toBe(expected.view)
      expect(UserService.hasPermission(role as UserRole, 'forms:create')).toBe(expected.create)
      expect(UserService.hasPermission(role as UserRole, 'forms:edit')).toBe(expected.edit)
      expect(UserService.hasPermission(role as UserRole, 'forms:delete')).toBe(expected.delete)
      expect(UserService.hasPermission(role as UserRole, 'forms:review')).toBe(expected.review)
    })
  })

  it('should have correct permission matrix for users', () => {
    const usersPermissions: Record<UserRole, { view: boolean; create: boolean; edit: boolean; delete: boolean }> = {
      admin: { view: true, create: true, edit: true, delete: true },
      doctor: { view: false, create: false, edit: false, delete: false },
      student: { view: false, create: false, edit: false, delete: false },
      guest: { view: false, create: false, edit: false, delete: false },
    }

    Object.entries(usersPermissions).forEach(([role, expected]) => {
      expect(UserService.hasPermission(role as UserRole, 'users:view')).toBe(expected.view)
      expect(UserService.hasPermission(role as UserRole, 'users:create')).toBe(expected.create)
      expect(UserService.hasPermission(role as UserRole, 'users:edit')).toBe(expected.edit)
      expect(UserService.hasPermission(role as UserRole, 'users:delete')).toBe(expected.delete)
    })
  })

  it('should have correct permission matrix for submissions', () => {
    const submissionsPermissions: Record<UserRole, { view: boolean; create: boolean; edit: boolean; delete: boolean; review: boolean }> = {
      admin: { view: true, create: true, edit: true, delete: true, review: true },
      doctor: { view: true, create: true, edit: true, delete: false, review: true },
      student: { view: true, create: true, edit: true, delete: false, review: false },
      guest: { view: true, create: false, edit: false, delete: false, review: false },
    }

    Object.entries(submissionsPermissions).forEach(([role, expected]) => {
      expect(UserService.hasPermission(role as UserRole, 'submissions:view')).toBe(expected.view)
      expect(UserService.hasPermission(role as UserRole, 'submissions:create')).toBe(expected.create)
      expect(UserService.hasPermission(role as UserRole, 'submissions:edit')).toBe(expected.edit)
      expect(UserService.hasPermission(role as UserRole, 'submissions:delete')).toBe(expected.delete)
      expect(UserService.hasPermission(role as UserRole, 'submissions:review')).toBe(expected.review)
    })
  })
})
