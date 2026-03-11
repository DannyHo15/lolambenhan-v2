/**
 * Database Connection
 */
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

const DATABASE_URL = process.env.DATABASE_URL || ""

let client: postgres.Sql<Record<string, never>> | null = null
let db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!db) {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not set")
    }
    const needsSSL =
      process.env.NODE_ENV === "production" || DATABASE_URL.includes("render.com")

    client = postgres(DATABASE_URL, {
      ssl: needsSSL ? { rejectUnauthorized: false } : false,
      max: 10,
    })
    db = drizzle(client)
  }
  return db
}

export async function closeDb() {
  if (client) {
    await client.end()
    client = null
    db = null
  }
}
