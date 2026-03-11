/**
 * Test Setup - Global configuration for all tests
 */
import { beforeAll, afterAll, afterEach, vi } from 'vitest'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '3099'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
process.env.ADMIN_PASSWORD = 'test-admin-password'
process.env.ADMIN_TOKEN_SECRET = 'test-token-secret-32chars'
process.env.GEMINI_API_KEY = 'test-gemini-key'

// Mock console in tests (optional - uncomment if needed)
// vi.spyOn(console, 'log').mockImplementation(() => {})
// vi.spyOn(console, 'error').mockImplementation(() => {})

// Global beforeAll hook
beforeAll(async () => {
  // Setup tasks that run once before all tests
})

// Global afterAll hook
afterAll(async () => {
  // Cleanup tasks that run once after all tests
  vi.restoreAllMocks()
})

// Global afterEach hook
afterEach(async () => {
  // Reset state after each test
  vi.clearAllMocks()
})
