/**
 * Google OAuth Authentication Service
 * Verifies Google ID tokens using google-auth-library
 * Enhanced with JWT token management and RBAC
 */
import { OAuth2Client } from "google-auth-library"
import { eq, and, isNull, gt } from "drizzle-orm"
import { randomBytes, createHash } from "crypto"
import { users, refreshTokens, type User, type NewUser, type NewRefreshToken } from "../../infrastructure/database/schema"
import { getDb } from "../../infrastructure/database/connection"

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || ""
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN || 3600) // 1 hour
const REFRESH_TOKEN_EXPIRES_IN = Number(process.env.REFRESH_TOKEN_EXPIRES_IN || 604800) // 7 days

if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set. Authentication will not work properly.")
}

// Role types
export type UserRole = 'admin' | 'doctor' | 'student' | 'guest'

// Permission types
export type Permission =
  | 'forms:view'
  | 'forms:create'
  | 'forms:edit'
  | 'forms:delete'
  | 'forms:review'
  | 'templates:view'
  | 'templates:create'
  | 'templates:edit'
  | 'templates:delete'
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'submissions:view'
  | 'submissions:create'
  | 'submissions:edit'
  | 'submissions:delete'
  | 'submissions:review'

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'forms:view', 'forms:create', 'forms:edit', 'forms:delete', 'forms:review',
    'templates:view', 'templates:create', 'templates:edit', 'templates:delete',
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'submissions:view', 'submissions:create', 'submissions:edit', 'submissions:delete', 'submissions:review',
  ],
  doctor: [
    'forms:view', 'forms:create', 'forms:edit',
    'templates:view',
    'submissions:view', 'submissions:create', 'submissions:edit', 'submissions:review',
  ],
  student: [
    'forms:view', 'forms:create',
    'templates:view',
    'submissions:view', 'submissions:create', 'submissions:edit',
  ],
  guest: [
    'forms:view',
    'templates:view',
    'submissions:view',
  ],
}

export interface GoogleUserPayload {
  sub: string
  email: string
  emailVerified: boolean
  name: string
  givenName?: string
  familyName?: string
  picture?: string
  locale?: string
}

// JWT payload
export interface JwtPayload {
  sub: string        // User ID
  email: string
  role: UserRole
  name: string
  iat: number        // Issued at
  exp: number        // Expiration
}

// Token response
export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: User
}

export class AuthService {
  private client: OAuth2Client
  private clientId: string

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || ""
    if (!this.clientId) {
      console.warn("[AuthService] GOOGLE_CLIENT_ID not configured - OAuth verification will fail")
    }
    this.client = new OAuth2Client(this.clientId)
  }

  /**
   * Verify a Google ID token and extract user information
   * @param token - The Google ID token (JWT) from frontend
   * @returns Verified user payload
   * @throws Error if verification fails
   */
  async verifyGoogleToken(token: string): Promise<GoogleUserPayload> {
    if (!this.clientId) {
      throw new Error("GOOGLE_CLIENT_ID not configured")
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: this.clientId,
      })

      const payload = ticket.getPayload()

      if (!payload) {
        throw new Error("Invalid token payload")
      }

      return {
        sub: payload.sub,
        email: payload.email || "",
        emailVerified: payload.email_verified ?? false,
        name: payload.name || "Unknown",
        givenName: payload.given_name,
        familyName: payload.family_name,
        picture: payload.picture,
        locale: payload.locale,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Token verification failed"
      console.error("[AuthService] Token verification failed:", message)
      throw new Error(`Google token verification failed: ${message}`)
    }
  }

  /**
   * Verify token and check if user is an admin
   * Admin list is configured via environment variable GOOGLE_ADMIN_EMAILS (comma-separated)
   * @param token - The Google ID token
   * @returns User payload with isAdmin flag
   */
  async verifyGoogleTokenWithAdmin(token: string): Promise<GoogleUserPayload & { isAdmin: boolean }> {
    const payload = await this.verifyGoogleToken(token)

    const adminEmails = (process.env.GOOGLE_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)

    const isAdmin = adminEmails.includes(payload.email.toLowerCase())

    return {
      ...payload,
      isAdmin,
    }
  }

  /**
   * Quick validation of token format (without full verification)
   * Useful for initial checks before making the async verification call
   */
  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== "string") {
      return false
    }
    // JWT format: header.payload.signature
    const parts = token.split(".")
    return parts.length === 3 && parts.every((part) => part.length > 0)
  }
}

/**
 * JWT Service - Simple JWT implementation
 */
export class JwtService {
  private static secret = JWT_SECRET

  static encodeBase64Url(data: string): string {
    return Buffer.from(data)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }

  static decodeBase64Url(data: string): string {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/")
    const padding = normalized.length % 4
    const padded = padding ? normalized + "=".repeat(4 - padding) : normalized
    return Buffer.from(padded, "base64").toString("utf-8")
  }

  static sign(payload: Record<string, unknown>): string {
    const header = {
      alg: "HS256",
      typ: "JWT",
    }

    const encodedHeader = this.encodeBase64Url(JSON.stringify(header))
    const encodedPayload = this.encodeBase64Url(JSON.stringify(payload))
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  static createSignature(data: string): string {
    return createHash("sha256")
      .update(data + this.secret)
      .digest("hex")
  }

  static verify(token: string): JwtPayload | null {
    try {
      const parts = token.split(".")
      if (parts.length !== 3) return null

      const [encodedHeader, encodedPayload, signature] = parts
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`)

      if (signature !== expectedSignature) return null

      const payload = JSON.parse(this.decodeBase64Url(encodedPayload)) as JwtPayload

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null
      }

      return payload
    } catch {
      return null
    }
  }

  static generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.fullName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN,
    }
    return this.sign(payload)
  }
}

/**
 * User Service - Database operations for users
 */
export class UserService {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || []
    return permissions.includes(permission)
  }

  /**
   * Check if a user has any of the specified permissions
   */
  static hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(role, p))
  }

  /**
   * Find or create user from Google OAuth
   */
  static async findOrCreateFromGoogle(googleUser: GoogleUserPayload): Promise<User> {
    const db = getDb()

    // Try to find existing user by email
    const existing = await db
      .select()
      .from(users)
      .where(and(eq(users.email, googleUser.email), isNull(users.deletedAt)))
      .limit(1)

    if (existing.length > 0) {
      const user = existing[0]

      // Update last login
      await db
        .update(users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id))

      return user
    }

    // Create new user
    const username = this.generateUsername(googleUser.email, googleUser.name)
    const role = this.determineRole(googleUser.email)

    const newUser: NewUser = {
      email: googleUser.email,
      username,
      fullName: googleUser.name,
      role,
      isActive: true,
    }

    const result = await db.insert(users).values(newUser).returning()
    return result[0]
  }

  /**
   * Generate username from email and name
   */
  static generateUsername(email: string, name: string): string {
    const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
    const random = randomBytes(3).toString("hex")
    return `${base}_${random}`
  }

  /**
   * Determine user role based on email domain
   */
  static determineRole(email: string): UserRole {
    const domain = email.split("@")[1]?.toLowerCase()

    // Configure allowed domains in environment
    const adminDomains = (process.env.ADMIN_EMAIL_DOMAINS || "").split(",").map((d) => d.trim())
    const doctorDomains = (process.env.DOCTOR_EMAIL_DOMAINS || "").split(",").map((d) => d.trim())

    if (adminDomains.includes(domain || "")) return "admin"
    if (doctorDomains.includes(domain || "")) return "doctor"

    // Default role
    return "student"
  }

  /**
   * Create tokens for a user
   */
  static async createTokens(user: User): Promise<TokenResponse> {
    const db = getDb()
    const accessToken = JwtService.generateAccessToken(user)
    const refreshToken = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000)

    // Store refresh token
    const newRefreshToken: NewRefreshToken = {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    }

    await db.insert(refreshTokens).values(newRefreshToken)

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      tokenType: "Bearer",
      user,
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<TokenResponse | null> {
    const db = getDb()

    // Find the refresh token
    const tokenRecord = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date())
        )
      )
      .limit(1)

    if (tokenRecord.length === 0) {
      return null
    }

    // Get the user
    const userRecord = await db
      .select()
      .from(users)
      .where(and(eq(users.id, tokenRecord[0].userId), isNull(users.deletedAt)))
      .limit(1)

    if (userRecord.length === 0) {
      return null
    }

    const user = userRecord[0]

    // Revoke old refresh token
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, tokenRecord[0].id))

    // Create new tokens
    return this.createTokens(user)
  }

  /**
   * Revoke refresh token (logout)
   */
  static async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    const db = getDb()

    const result = await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.token, refreshToken), isNull(refreshTokens.revokedAt)))

    return (result.rowCount ?? 0) > 0
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    const db = getDb()

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const db = getDb()

    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1)

    return result[0] || null
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const db = getDb()

    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1)

    return result[0] || null
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: UserRole): Promise<User | null> {
    const db = getDb()

    const result = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning()

    return result[0] || null
  }
}

// Singleton instance
let authServiceInstance: AuthService | null = null

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService()
  }
  return authServiceInstance
}
