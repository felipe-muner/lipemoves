import { neon } from "@neondatabase/serverless"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http"
import postgres from "postgres"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

const url = process.env.DATABASE_URL!
const isNeon = url.includes("neon.tech")

// Neon serverless (HTTP) for production, postgres.js for local Docker
const instance = isNeon
  ? drizzleNeon(neon(url), { schema })
  : drizzlePostgres(postgres(url), { schema })

// Cast to a single type so all consumers have consistent types
export const db = instance as typeof instance & ReturnType<typeof drizzleNeon>
