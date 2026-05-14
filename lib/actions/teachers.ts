"use server"

import { db } from "@/lib/db"
import { teachers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("Sem permissão")
  }
  return session
}

export async function createTeacher(formData: FormData) {
  await requireManageScope()
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const passport = String(formData.get("passport") ?? "").trim() || null
  const bio = String(formData.get("bio") ?? "").trim() || null
  const isActive = formData.get("isActive") === "on"

  if (!name) throw new Error("Name is required")
  if (!email) throw new Error("Email is required")

  await db.insert(teachers).values({
    name,
    email,
    phone,
    passport,
    bio,
    isActive,
  })

  revalidatePath("/dashboard/teachers")
}

export async function updateTeacher(id: string, formData: FormData) {
  await requireManageScope()
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const passport = String(formData.get("passport") ?? "").trim() || null
  const bio = String(formData.get("bio") ?? "").trim() || null
  const isActive = formData.get("isActive") === "on"

  if (!name) throw new Error("Name is required")

  await db
    .update(teachers)
    .set({
      name,
      email,
      phone,
      passport,
      bio,
      isActive,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(teachers.id, id))

  revalidatePath("/dashboard/teachers")
}

export async function deleteTeacher(id: string) {
  await requireManageScope()
  await db.delete(teachers).where(eq(teachers.id, id))
  revalidatePath("/dashboard/teachers")
}
