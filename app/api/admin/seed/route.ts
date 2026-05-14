import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { seedCrm } from "@/scripts/seed-crm"

export const maxDuration = 300

export async function POST() {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  try {
    await seedCrm()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "seed failed" },
      { status: 500 },
    )
  }
}
