import { drizzle as drizzleNeon } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import postgres from "postgres"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

// Canonical drizzle + neon setup, per
// https://orm.drizzle.team/docs/tutorials/drizzle-with-neon — with a tiny
// fallback so `next build` can still collect page data when DATABASE_URL
// hasn't been wired up yet on the build environment. Actual queries will
// fail with a clear error at runtime instead.
const url =
  process.env.DATABASE_URL ??
  "postgres://invalid:invalid@localhost:5432/_missing_database_url"

const isNeon = url.includes("neon.tech")

// Single common type so consumers see one `db` API regardless of driver.
type DrizzleClient = ReturnType<typeof drizzleNeon<typeof schema>>

export const db: DrizzleClient = (
  isNeon
    ? drizzleNeon({ client: neon(url), schema })
    : drizzlePostgres({ client: postgres(url), schema })
) as DrizzleClient
