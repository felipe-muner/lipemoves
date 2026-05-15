"use server"

import { db } from "@/lib/db"
import { students } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role === "teacher") {
    throw new Error("No permission")
  }
  return session
}

function readFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const passport = String(formData.get("passport") ?? "").trim() || null
  const nationality = String(formData.get("nationality") ?? "").trim() || null
  const notes = String(formData.get("notes") ?? "").trim() || null
  return { name, email, phone, passport, nationality, notes }
}

export async function createStudent(formData: FormData) {
  await requireManageScope()
  const { name, email, phone, passport, nationality, notes } = readFields(formData)

  if (!name) throw new Error("Name is required")
  if (!email) throw new Error("Email is required")

  const [existing] = await db
    .select({ email: students.email })
    .from(students)
    .where(eq(students.email, email))
    .limit(1)
  if (existing) throw new Error("A student with this email already exists")

  await db.insert(students).values({
    email,
    name,
    phone,
    passport,
    nationality,
    notes,
  })

  revalidatePath("/dashboard/students")
}

export async function updateStudent(email: string, formData: FormData) {
  await requireManageScope()
  const fields = readFields(formData)

  if (!fields.name) throw new Error("Name is required")

  await db
    .update(students)
    .set({
      name: fields.name,
      phone: fields.phone,
      passport: fields.passport,
      nationality: fields.nationality,
      notes: fields.notes,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(students.email, email))

  revalidatePath("/dashboard/students")
}

export async function deleteStudent(email: string) {
  await requireManageScope()
  await db.delete(students).where(eq(students.email, email))
  revalidatePath("/dashboard/students")
}
