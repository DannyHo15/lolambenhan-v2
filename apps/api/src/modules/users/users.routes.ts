/**
 * User Management Routes
 * Admin-only routes for managing users
 */
import { Elysia, t } from "elysia"
import { eq, and, isNull, or, sql, desc } from "drizzle-orm"
import { ResponseDto, BadRequestError, UnauthorizedError, NotFoundError } from "../../shared/response.dto"
import { users, type User, type NewUser } from "../../infrastructure/database/schema"
import { getDb } from "../../infrastructure/database/connection"
import { requireRole, UserService, type UserRole, ROLE_PERMISSIONS } from "../auth"

/**
 * User Routes - Admin only
 */
export const userRoutes = new Elysia({ prefix: "/users" })
  .use(requireRole("admin"))
  // ============================================
  // LIST USERS
  // ============================================
  .get(
    "/",
    async ({ query }) => {
      const db = getDb()
      const { role, isActive, search, limit = "50", offset = "0" } = query as {
        role?: string
        isActive?: string
        search?: string
        limit?: string
        offset?: string
      }

      let queryBuilder = db
        .select()
        .from(users)
        .where(isNull(users.deletedAt))
        .limit(Number(limit))
        .offset(Number(offset))
        .orderBy(desc(users.createdAt))

      // Apply filters
      const conditions = [isNull(users.deletedAt)]

      if (role) {
        conditions.push(eq(users.role, role))
      }

      if (isActive !== undefined) {
        conditions.push(eq(users.isActive, isActive === "true"))
      }

      const result = await db
        .select()
        .from(users)
        .where(and(...conditions))
        .limit(Number(limit))
        .offset(Number(offset))
        .orderBy(desc(users.createdAt))

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(...conditions))

      return ResponseDto.success({
        users: result,
        total: countResult[0]?.count ?? 0,
        limit: Number(limit),
        offset: Number(offset),
      })
    },
    {
      query: t.Object({
        role: t.Optional(t.String()),
        isActive: t.Optional(t.String()),
        search: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
      detail: {
        summary: "List users",
        description: "Get paginated list of users (admin only)",
      },
    }
  )

  // ============================================
  // GET USER BY ID
  // ============================================
  .get(
    "/:id",
    async ({ params }) => {
      const db = getDb()

      const result = await db
        .select()
        .from(users)
        .where(and(eq(users.id, params.id), isNull(users.deletedAt)))
        .limit(1)

      if (result.length === 0) {
        throw new NotFoundError("User not found")
      }

      return ResponseDto.success({ user: result[0] })
    },
    {
      detail: {
        summary: "Get user by ID",
        description: "Get a specific user by their ID (admin only)",
      },
    }
  )

  // ============================================
  // CREATE USER (manual creation)
  // ============================================
  .post(
    "/",
    async ({ body }) => {
      const db = getDb()

      const { email, username, fullName, role, department, isActive } = body as {
        email: string
        username: string
        fullName: string
        role?: string
        department?: string
        isActive?: boolean
      }

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existingEmail.length > 0) {
        throw new BadRequestError("Email already exists")
      }

      // Check if username already exists
      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1)

      if (existingUsername.length > 0) {
        throw new BadRequestError("Username already exists")
      }

      const newUser: NewUser = {
        email,
        username,
        fullName,
        role: (role as UserRole) || "student",
        department,
        isActive: isActive ?? true,
      }

      const result = await db.insert(users).values(newUser).returning()

      return ResponseDto.success({ user: result[0] }, "User created successfully")
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        username: t.String({ minLength: 3, maxLength: 50 }),
        fullName: t.String({ minLength: 1, maxLength: 100 }),
        role: t.Optional(t.String()),
        department: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        summary: "Create user",
        description: "Manually create a new user (admin only)",
      },
    }
  )

  // ============================================
  // UPDATE USER
  // ============================================
  .patch(
    "/:id",
    async ({ params, body }) => {
      const db = getDb()

      const { fullName, role, department, isActive } = body as {
        fullName?: string
        role?: string
        department?: string
        isActive?: boolean
      }

      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(and(eq(users.id, params.id), isNull(users.deletedAt)))
        .limit(1)

      if (existing.length === 0) {
        throw new NotFoundError("User not found")
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      if (fullName !== undefined) updateData.fullName = fullName
      if (role !== undefined) updateData.role = role
      if (department !== undefined) updateData.department = department
      if (isActive !== undefined) updateData.isActive = isActive

      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, params.id))
        .returning()

      return ResponseDto.success({ user: result[0] }, "User updated successfully")
    },
    {
      body: t.Object({
        fullName: t.Optional(t.String()),
        role: t.Optional(t.String()),
        department: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        summary: "Update user",
        description: "Update user details (admin only)",
      },
    }
  )

  // ============================================
  // DELETE USER (soft delete)
  // ============================================
  .delete(
    "/:id",
    async ({ params }) => {
      const db = getDb()

      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(and(eq(users.id, params.id), isNull(users.deletedAt)))
        .limit(1)

      if (existing.length === 0) {
        throw new NotFoundError("User not found")
      }

      // Soft delete
      await db
        .update(users)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, params.id))

      return ResponseDto.success({ deleted: true, id: params.id }, "User deleted successfully")
    },
    {
      detail: {
        summary: "Delete user",
        description: "Soft delete a user (admin only)",
      },
    }
  )

  // ============================================
  // RESTORE USER
  // ============================================
  .post(
    "/:id/restore",
    async ({ params }) => {
      const db = getDb()

      // Check if user exists (including deleted)
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, params.id))
        .limit(1)

      if (existing.length === 0) {
        throw new NotFoundError("User not found")
      }

      // Restore
      const result = await db
        .update(users)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(users.id, params.id))
        .returning()

      return ResponseDto.success({ user: result[0] }, "User restored successfully")
    },
    {
      detail: {
        summary: "Restore user",
        description: "Restore a soft-deleted user (admin only)",
      },
    }
  )

  // ============================================
  // GET USER PERMISSIONS
  // ============================================
  .get(
    "/:id/permissions",
    async ({ params }) => {
      const db = getDb()

      const result = await db
        .select()
        .from(users)
        .where(and(eq(users.id, params.id), isNull(users.deletedAt)))
        .limit(1)

      if (result.length === 0) {
        throw new NotFoundError("User not found")
      }

      const user = result[0]
      const role = user.role as UserRole
      const permissions = ROLE_PERMISSIONS[role] || []

      return ResponseDto.success({
        userId: user.id,
        role,
        permissions,
      })
    },
    {
      detail: {
        summary: "Get user permissions",
        description: "Get all permissions for a specific user (admin only)",
      },
    }
  )

  // ============================================
  // GET ROLES
  // ============================================
  .get(
    "/roles/list",
    async () => {
      const roles = Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
        name: role,
        permissions,
        permissionCount: permissions.length,
      }))

      return ResponseDto.success({ roles })
    },
    {
      detail: {
        summary: "List available roles",
        description: "Get all available roles and their permissions",
      },
    }
  )

  // ============================================
  // UPDATE USER ROLE
  // ============================================
  .post(
    "/:id/role",
    async ({ params, body }) => {
      const { role } = body as { role: string }

      // Validate role
      const validRoles = Object.keys(ROLE_PERMISSIONS)
      if (!validRoles.includes(role)) {
        throw new BadRequestError(`Invalid role. Valid roles: ${validRoles.join(", ")}`)
      }

      const user = await UserService.updateUserRole(params.id, role as UserRole)

      if (!user) {
        throw new NotFoundError("User not found")
      }

      return ResponseDto.success({ user }, "Role updated successfully")
    },
    {
      body: t.Object({
        role: t.String(),
      }),
      detail: {
        summary: "Update user role",
        description: "Change a user's role (admin only)",
      },
    }
  )
