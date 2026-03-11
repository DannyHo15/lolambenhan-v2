/**
 * Database Mock - Mock Drizzle ORM database operations
 */
import { vi } from 'vitest'

/**
 * Create a mock query chain for Drizzle ORM
 */
export function createMockQueryChain<T>(returnValue: T | T[] | null = null) {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(Array.isArray(returnValue) ? returnValue : returnValue ? [returnValue] : []),
  }

  return mockChain
}

/**
 * Create a mock database instance
 */
export function createMockDb() {
  const queryResults: Record<string, unknown[]> = {}

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn().mockResolvedValue([]),
            })),
            mockResolvedValue: vi.fn().mockResolvedValue([]),
          })),
          limit: vi.fn(() => ({
            offset: vi.fn().mockResolvedValue([]),
          })),
          mockResolvedValue: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([]),
      })),
    })),
  }

  return mockDb
}

/**
 * Mock the getDb function
 */
export function mockGetDb(mockDb: ReturnType<typeof createMockDb>) {
  vi.mock('../src/infrastructure/database/connection', () => ({
    getDb: () => mockDb,
    closeDb: vi.fn().mockResolvedValue(undefined),
  }))
}
