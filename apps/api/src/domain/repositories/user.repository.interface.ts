/**
 * User Repository Interface (Port)
 * Defines contract - no implementation
 */
import type { User, CreateUserInput, UserRole } from "../entities/user.entity"

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  findAll(limit?: number): Promise<User[]>
  create(input: CreateUserInput): Promise<User>
  update(id: string, data: Partial<User>): Promise<User | null>
  delete(id: string): Promise<boolean>
  findByRole(role: UserRole): Promise<User[]>
}
