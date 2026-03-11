/**
 * Auth Module - Google OAuth verification, JWT, and RBAC
 */
export {
  AuthService,
  getAuthService,
  JwtService,
  UserService,
  type GoogleUserPayload,
  type JwtPayload,
  type TokenResponse,
  type UserRole,
  type Permission,
  ROLE_PERMISSIONS,
} from "./auth.service"

export {
  authRoutes,
  authMiddleware,
  requireAuth,
  requireRole,
  requirePermission,
} from "./auth.routes"
