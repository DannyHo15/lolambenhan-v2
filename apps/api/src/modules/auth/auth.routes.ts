/**
 * Authentication Routes
 * Handles login, token refresh, and logout
 */
import { Elysia, t } from "elysia"
import { ResponseDto, BadRequestError, UnauthorizedError } from "../../shared/response.dto"
import { getAuthService, UserService, JwtService, type JwtPayload } from "./auth.service"

/**
 * Auth middleware - extracts and validates JWT from Authorization header
 */
export const authMiddleware = new Elysia({ name: "auth" })
  .derive({ as: "scoped" }, async ({ bearer, request }) => {
    if (!bearer) {
      return { user: null, jwtPayload: null }
    }

    const payload = JwtService.verify(bearer)
    if (!payload) {
      return { user: null, jwtPayload: null }
    }

    const user = await UserService.getUserById(payload.sub)
    return { user, jwtPayload: payload }
  })

/**
 * Require authentication middleware
 */
export const requireAuth = new Elysia({ name: "requireAuth" })
  .use(authMiddleware)
  .onBeforeHandle(({ user }) => {
    if (!user) {
      throw new UnauthorizedError("Authentication required")
    }
  })

/**
 * Require role middleware factory
 */
export const requireRole = (...roles: string[]) => {
  return new Elysia({ name: `requireRole-${roles.join("-")}` })
    .use(requireAuth)
    .onBeforeHandle(({ user }) => {
      if (!user || !roles.includes(user.role)) {
        throw new UnauthorizedError("Insufficient permissions")
      }
    })
}

/**
 * Require permission middleware factory
 */
export const requirePermission = (permission: string) => {
  return new Elysia({ name: `requirePermission-${permission}` })
    .use(requireAuth)
    .onBeforeHandle(({ user }) => {
      if (!user || !UserService.hasPermission(user.role as any, permission as any)) {
        throw new UnauthorizedError("Insufficient permissions")
      }
    })
}

/**
 * Auth Routes
 */
export const authRoutes = new Elysia({ prefix: "/auth" })
  // ============================================
  // LOGIN WITH GOOGLE
  // ============================================
  .post(
    "/login",
    async ({ body }) => {
      const { idToken } = body as { idToken: string }

      const authService = getAuthService()

      // Verify Google token
      let googleUser
      try {
        googleUser = await authService.verifyGoogleToken(idToken)
      } catch (error) {
        throw new UnauthorizedError(error instanceof Error ? error.message : "Token verification failed")
      }

      // Find or create user
      const user = await UserService.findOrCreateFromGoogle(googleUser)

      // Create tokens
      const tokens = await UserService.createTokens(user)

      return ResponseDto.success(tokens, "Login successful")
    },
    {
      body: t.Object({
        idToken: t.String({ description: "Google ID token" }),
      }),
      detail: {
        summary: "Login with Google",
        description: "Verify Google ID token and return access/refresh tokens",
      },
    }
  )

  // ============================================
  // REFRESH TOKEN
  // ============================================
  .post(
    "/refresh",
    async ({ body }) => {
      const { refreshToken } = body as { refreshToken: string }

      const tokens = await UserService.refreshAccessToken(refreshToken)

      if (!tokens) {
        throw new UnauthorizedError("Invalid or expired refresh token")
      }

      return ResponseDto.success(tokens, "Token refreshed successfully")
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
      detail: {
        summary: "Refresh access token",
        description: "Exchange refresh token for new access/refresh tokens",
      },
    }
  )

  // ============================================
  // LOGOUT
  // ============================================
  .post(
    "/logout",
    async ({ body }) => {
      const { refreshToken } = body as { refreshToken: string }

      await UserService.revokeRefreshToken(refreshToken)

      return ResponseDto.success({ loggedOut: true }, "Logout successful")
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
      detail: {
        summary: "Logout",
        description: "Revoke refresh token",
      },
    }
  )

  // ============================================
  // LOGOUT ALL DEVICES
  // ============================================
  .use(requireAuth)
  .post(
    "/logout-all",
    async ({ user }) => {
      if (!user) {
        throw new UnauthorizedError()
      }

      await UserService.revokeAllUserTokens(user.id)

      return ResponseDto.success({ loggedOut: true }, "Logged out from all devices")
    },
    {
      detail: {
        summary: "Logout from all devices",
        description: "Revoke all refresh tokens for the current user",
      },
    }
  )

  // ============================================
  // GET CURRENT USER
  // ============================================
  .get(
    "/me",
    async ({ user }) => {
      if (!user) {
        throw new UnauthorizedError()
      }

      return ResponseDto.success({
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })
    },
    {
      detail: {
        summary: "Get current user",
        description: "Get the authenticated user's profile",
      },
    }
  )

  // ============================================
  // VERIFY TOKEN (for other services)
  // ============================================
  .post(
    "/verify",
    async ({ body }) => {
      const { token } = body as { token: string }

      const payload = JwtService.verify(token)

      if (!payload) {
        throw new UnauthorizedError("Invalid or expired token")
      }

      const user = await UserService.getUserById(payload.sub)

      if (!user) {
        throw new UnauthorizedError("User not found")
      }

      return ResponseDto.success({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
      })
    },
    {
      body: t.Object({
        token: t.String(),
      }),
      detail: {
        summary: "Verify token",
        description: "Verify an access token and return user info",
      },
    }
  )

  // ============================================
  // GOOGLE AUTH (alias for frontend compatibility)
  // ============================================
  .post(
    "/google",
    async ({ body }) => {
      const { idToken } = body as { idToken: string }

      const authService = getAuthService()

      // Verify Google token
      let googleUser
      try {
        googleUser = await authService.verifyGoogleToken(idToken)
      } catch (error) {
        throw new UnauthorizedError(error instanceof Error ? error.message : "Token verification failed")
      }

      // Find or create user
      const user = await UserService.findOrCreateFromGoogle(googleUser)

      // Create tokens
      const tokens = await UserService.createTokens(user)

      return ResponseDto.success(tokens, "Login successful")
    },
    {
      body: t.Object({
        idToken: t.String({ description: "Google ID token" }),
      }),
      detail: {
        summary: "Login with Google",
        description: "Verify Google ID token and return access/refresh tokens (alias for /auth/login)",
      },
    }
  )

  // ============================================
  // VERIFY JWT (GET version for convenience)
  // ============================================
  .get(
    "/verify",
    async ({ bearer }) => {
      if (!bearer) {
        throw new UnauthorizedError("Missing token")
      }

      const payload = JwtService.verify(bearer)

      if (!payload) {
        throw new UnauthorizedError("Invalid or expired token")
      }

      const user = await UserService.getUserById(payload.sub)

      if (!user) {
        throw new UnauthorizedError("User not found")
      }

      return ResponseDto.success({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
      })
    },
    {
      detail: {
        summary: "Verify JWT token",
        description: "Verify access token from Authorization header and return user info",
      },
    }
  )
