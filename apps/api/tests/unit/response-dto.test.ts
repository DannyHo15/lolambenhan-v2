/**
 * Unit Tests for ResponseDto and Error Classes
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  ResponseDto,
  ApiResponse,
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
} from '../../src/shared/response.dto'

describe('ResponseDto', () => {
  describe('success', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'Test' }
      const response = ResponseDto.success(data)

      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
      expect(response.timestamp).toBeDefined()
      expect(response.error).toBeUndefined()
    })

    it('should create a success response without data', () => {
      const response = ResponseDto.success()

      expect(response.success).toBe(true)
      expect(response.data).toBeUndefined()
    })

    it('should include valid ISO timestamp', () => {
      const response = ResponseDto.success({ test: true })
      const timestamp = new Date(response.timestamp)

      expect(timestamp.toISOString()).toBe(response.timestamp)
    })

    it('should handle null data', () => {
      const response = ResponseDto.success(null)

      expect(response.success).toBe(true)
      expect(response.data).toBeNull()
    })

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const response = ResponseDto.success(data)

      expect(response.data).toEqual(data)
    })

    it('should handle complex nested data', () => {
      const data = {
        user: {
          id: 1,
          profile: {
            name: 'Test',
            settings: { theme: 'dark' },
          },
        },
        items: [1, 2, 3],
      }
      const response = ResponseDto.success(data)

      expect(response.data).toEqual(data)
    })
  })

  describe('error', () => {
    it('should create an error response', () => {
      const response = ResponseDto.error('TEST_ERROR', 'Test error message')

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error?.code).toBe('TEST_ERROR')
      expect(response.error?.message).toBe('Test error message')
      expect(response.data).toBeUndefined()
    })

    it('should include error details', () => {
      const details = { field: 'username', reason: 'required' }
      const response = ResponseDto.error('VALIDATION_ERROR', 'Invalid input', details)

      expect(response.error?.details).toEqual(details)
    })

    it('should include valid ISO timestamp', () => {
      const response = ResponseDto.error('ERROR', 'Message')
      const timestamp = new Date(response.timestamp)

      expect(timestamp.toISOString()).toBe(response.timestamp)
    })
  })
})

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create base app error', () => {
      const error = new AppError('CUSTOM_CODE', 400, 'Custom message')

      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe('CUSTOM_CODE')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Custom message')
      expect(error.name).toBe('AppError')
    })

    it('should include details', () => {
      const details = { field: 'test' }
      const error = new AppError('CODE', 400, 'Message', details)

      expect(error.details).toEqual(details)
    })
  })

  describe('BadRequestError', () => {
    it('should create bad request error', () => {
      const error = new BadRequestError('Invalid input')

      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(BadRequestError)
      expect(error.code).toBe('BAD_REQUEST')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Invalid input')
    })

    it('should create bad request error with details', () => {
      const details = { field: 'email', reason: 'invalid format' }
      const error = new BadRequestError('Invalid email', details)

      expect(error.details).toEqual(details)
    })
  })

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError()

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('Unauthorized')
    })

    it('should create unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Token expired')

      expect(error.message).toBe('Token expired')
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error with default message', () => {
      const error = new NotFoundError()

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('Resource not found')
    })

    it('should create not found error with custom message', () => {
      const error = new NotFoundError('User not found')

      expect(error.message).toBe('User not found')
    })
  })

  describe('RateLimitError', () => {
    it('should create rate limit error without retry after', () => {
      const error = new RateLimitError()

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe('RATE_LIMITED')
      expect(error.statusCode).toBe(429)
      expect(error.message).toBe('Rate limit exceeded')
    })

    it('should create rate limit error with retry after', () => {
      const error = new RateLimitError(60)

      expect(error.details).toEqual({ retryAfter: 60 })
    })

    it('should include additional details', () => {
      const error = new RateLimitError(30, { limit: 100, window: '1h' })

      expect(error.details).toEqual({
        retryAfter: 30,
        limit: 100,
        window: '1h',
      })
    })
  })

  describe('InternalServerError', () => {
    it('should create internal server error with default message', () => {
      const error = new InternalServerError()

      expect(error).toBeInstanceOf(AppError)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.message).toBe('Internal server error')
    })

    it('should create internal server error with custom message', () => {
      const error = new InternalServerError('Database connection failed')

      expect(error.message).toBe('Database connection failed')
    })
  })
})
