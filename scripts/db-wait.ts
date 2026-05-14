/**
 * Block until DATABASE_URL is accepting connections.
 * Used by `pnpm db:reset` between `docker compose up` and `drizzle-kit push`
 * so we don't race against Postgres' startup.
 */

import postgres from "postgres"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}

const TIMEOUT_MS = 30_000
const INTERVAL_MS = 500

async function ping(): Promise<boolean> {
  const sql = postgres(url!, {
    max: 1,
    idle_timeout: 1,
    connect_timeout: 2,
    onnotice: () => {},
  })
  try {
    await sql`select 1`
    return true
  } catch {
    return false
  } finally {
    await sql.end({ timeout: 1 }).catch(() => {})
  }
}

async function main() {
  process.stdout.write("→ Waiting for Postgres ")
  const started = Date.now()
  while (Date.now() - started < TIMEOUT_MS) {
    if (await ping()) {
      console.log(`✓ ready (${Date.now() - started}ms)`)
      process.exit(0)
    }
    process.stdout.write(".")
    await new Promise((r) => setTimeout(r, INTERVAL_MS))
  }
  console.error(`\n✗ Timed out after ${TIMEOUT_MS}ms`)
  process.exit(1)
}

main()
