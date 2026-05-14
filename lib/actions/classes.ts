"use server"

import { db } from "@/lib/db"
import { yogaClasses, teachers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"
import { parseISO, formatISO } from "date-fns"

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("Sem permissão")
  }
  return session
}

export async function createClass(formData: FormData) {
  await requireManageScope()
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim()
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60)
  const dropInPriceThb = Number(formData.get("dropInPriceThb") ?? 0)
  const capacityRaw = String(formData.get("capacity") ?? "").trim()
  const capacity = capacityRaw ? Number(capacityRaw) : null
  const teacherId = String(formData.get("teacherId") ?? "").trim() || null

  if (!name) throw new Error("Nome é obrigatório")
  if (!scheduledAtRaw) throw new Error("Data/hora é obrigatória")

  await db.insert(yogaClasses).values({
    teacherId,
    name,
    description,
    scheduledAt: formatISO(parseISO(scheduledAtRaw)),
    durationMinutes,
    dropInPriceCents: Math.round(dropInPriceThb * 100),
    capacity,
  })

  revalidatePath("/dashboard/classes")
  revalidatePath("/dashboard/bookings")
}

export async function updateClass(id: string, formData: FormData) {
  await requireManageScope()
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim()
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60)
  const dropInPriceThb = Number(formData.get("dropInPriceThb") ?? 0)
  const capacityRaw = String(formData.get("capacity") ?? "").trim()
  const capacity = capacityRaw ? Number(capacityRaw) : null
  const teacherId = String(formData.get("teacherId") ?? "").trim() || null

  if (!name) throw new Error("Nome é obrigatório")
  if (!scheduledAtRaw) throw new Error("Data/hora é obrigatória")

  await db
    .update(yogaClasses)
    .set({
      name,
      description,
      scheduledAt: formatISO(parseISO(scheduledAtRaw)),
      durationMinutes,
      dropInPriceCents: Math.round(dropInPriceThb * 100),
      capacity,
      teacherId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(yogaClasses.id, id))

  revalidatePath("/dashboard/classes")
  revalidatePath("/dashboard/bookings")
}

export interface ImportClassRow {
  line: number
  name?: string
  teacherEmail?: string
  date?: string // YYYY-MM-DD
  time?: string // HH:MM
  durationMinutes?: number | string
  dropInPriceThb?: number | string
  capacity?: number | string
  description?: string
}

export interface ImportLineResult {
  line: number
  ok: boolean
  message?: string
  preview?: string
}

export interface ImportClassesResult {
  imported: number
  failed: number
  results: ImportLineResult[]
}

export async function importClasses(
  rows: ImportClassRow[],
): Promise<ImportClassesResult> {
  await requireManageScope()

  // Pre-fetch teachers for email lookup
  const teacherList = await db
    .select({ id: teachers.id, email: teachers.email })
    .from(teachers)
  const emailToId = new Map(
    teacherList.map((t) => [t.email.toLowerCase(), t.id]),
  )

  const results: ImportLineResult[] = []
  const toInsert: Array<typeof yogaClasses.$inferInsert> = []

  for (const row of rows) {
    const line = row.line
    const name = String(row.name ?? "").trim()
    if (!name) {
      results.push({ line, ok: false, message: "Missing class name" })
      continue
    }

    const date = String(row.date ?? "").trim()
    const time = String(row.time ?? "").trim()
    if (!date || !time) {
      results.push({
        line,
        ok: false,
        message: "Missing date or time (need YYYY-MM-DD and HH:MM)",
      })
      continue
    }

    const dateTimeStr = `${date}T${time.length === 5 ? time : time.slice(0, 5)}:00`
    const parsed = parseISO(dateTimeStr)
    if (Number.isNaN(parsed.getTime())) {
      results.push({
        line,
        ok: false,
        message: `Invalid date/time "${date} ${time}"`,
      })
      continue
    }

    let teacherId: string | null = null
    const tEmail = String(row.teacherEmail ?? "").trim().toLowerCase()
    if (tEmail) {
      const found = emailToId.get(tEmail)
      if (!found) {
        results.push({
          line,
          ok: false,
          message: `Teacher email "${tEmail}" not found`,
        })
        continue
      }
      teacherId = found
    }

    const duration = Number(row.durationMinutes ?? 60)
    if (!Number.isFinite(duration) || duration <= 0) {
      results.push({
        line,
        ok: false,
        message: `Invalid duration "${row.durationMinutes}"`,
      })
      continue
    }

    const priceThb = Number(row.dropInPriceThb ?? 0)
    if (!Number.isFinite(priceThb) || priceThb < 0) {
      results.push({
        line,
        ok: false,
        message: `Invalid price "${row.dropInPriceThb}"`,
      })
      continue
    }

    const capacityRaw = row.capacity
    let capacity: number | null = null
    if (capacityRaw !== undefined && capacityRaw !== "" && capacityRaw !== null) {
      const cap = Number(capacityRaw)
      if (!Number.isFinite(cap) || cap <= 0) {
        results.push({
          line,
          ok: false,
          message: `Invalid capacity "${capacityRaw}"`,
        })
        continue
      }
      capacity = cap
    }

    toInsert.push({
      teacherId,
      name,
      description: row.description?.trim() || null,
      scheduledAt: formatISO(parsed),
      durationMinutes: duration,
      dropInPriceCents: Math.round(priceThb * 100),
      capacity,
    })

    results.push({
      line,
      ok: true,
      preview: `${name} · ${date} ${time} · ${tEmail || "no teacher"}`,
    })
  }

  if (toInsert.length > 0) {
    await db.insert(yogaClasses).values(toInsert)
  }

  revalidatePath("/dashboard/classes")
  revalidatePath("/dashboard/bookings")

  return {
    imported: toInsert.length,
    failed: results.filter((r) => !r.ok).length,
    results,
  }
}

export async function deleteClass(id: string) {
  await requireManageScope()
  await db.delete(yogaClasses).where(eq(yogaClasses.id, id))
  revalidatePath("/dashboard/classes")
  revalidatePath("/dashboard/bookings")
}
