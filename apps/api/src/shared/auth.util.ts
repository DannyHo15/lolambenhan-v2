/**
 * Auth Utility - Token verification for admin routes
 */
import { createHmac, randomBytes, timingSafeEqual } from "crypto"

const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET || ""

/**
 * Generate a new admin token
 */
export function generateToken(): string {
  const raw = randomBytes(24).toString("hex")
  const sig = createHmac("sha256", adminTokenSecret)
    .update(raw)
    .digest("hex")
  return `${raw}.${sig}`
}

/**
 * Verify an admin token
 */
export function verifyToken(token: string): boolean {
  if (!token || !adminTokenSecret) return false
  const parts = token.split(".")
  if (parts.length !== 2) return false
  const [raw, sig] = parts
  const expected = createHmac("sha256", adminTokenSecret)
    .update(raw)
    .digest("hex")
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

/**
 * Verify admin password
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || ""
  return password === adminPassword
}
