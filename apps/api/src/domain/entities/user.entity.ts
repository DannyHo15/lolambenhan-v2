/**
 * User Entity
 * Pure domain entity - no framework dependencies
 */
export type UserRole = "admin" | "doctor" | "student" | "guest"

export interface User {
  id: string
  email: string
  username: string
  fullName: string
  role: UserRole
  department?: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  username: string
  fullName: string
  role?: UserRole
  department?: string
}
