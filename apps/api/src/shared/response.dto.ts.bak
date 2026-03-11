/**
 * Standard Response DTO
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
}

export class ResponseDto {
  static success<T>(data?: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }
  }

  static error(code: string, message: string, details?: unknown): ApiResponse {
    return {
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Custom Error Classes
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super("BAD_REQUEST", 400, message, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", details?: unknown) {
    super("UNAUTHORIZED", 401, message, details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", details?: unknown) {
    super("NOT_FOUND", 404, message, details)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number, details?: unknown) {
    super("RATE_LIMITED", 429, "Rate limit exceeded", { retryAfter, ...details })
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error", details?: unknown) {
    super("INTERNAL_ERROR", 500, message, details)
  }
}
