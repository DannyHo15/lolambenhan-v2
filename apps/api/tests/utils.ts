/**
 * Test Utilities - Helper functions for testing
 */
import { vi } from 'vitest'
import type { FormTemplate, FormSubmission, Comment, HoichanMessage } from '../src/infrastructure/database/schema'

/**
 * Create a mock request object for Elysia
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    headers: new Headers(),
    json: vi.fn(),
    text: vi.fn(),
    ...overrides,
  }
}

/**
 * Create mock headers with IP address
 */
export function createMockHeaders(ip: string = '127.0.0.1'): Headers {
  return new Headers({
    'x-forwarded-for': ip,
    'x-real-ip': ip,
    'content-type': 'application/json',
  })
}

/**
 * Wait for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate a random string
 */
export function randomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, length + 2)
}

/**
 * Generate a random integer between min and max
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Assert that an error is an instance of a specific error class
 */
export function assertErrorType(error: unknown, errorClass: new (...args: any[]) => Error): void {
  if (!(error instanceof errorClass)) {
    throw new Error(`Expected error to be instance of ${errorClass.name}, got ${error?.constructor?.name}`)
  }
}

/**
 * Create a mock database result
 */
export function createMockDbResult<T>(data: T): { rows: T[]; rowCount: number } {
  return {
    rows: Array.isArray(data) ? data : [data],
    rowCount: Array.isArray(data) ? data.length : 1,
  }
}
