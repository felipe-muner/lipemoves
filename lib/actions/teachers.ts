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
  const bio = String(formData.get("bio") ?? "").trim() || null
  const payPerClassThb = Number(formData.get("payPerClassThb") ?? 0)
  const isActive = formData.get("isActive") === "on"

  if (!name) throw new Error("Nome é obrigatório")
  if (!email) throw new Error("E-mail é obrigatório")

  await db.insert(teachers).values({
    name,
    email,
    phone,
    bio,
    payPerClassCents: Math.round(payPerClassThb * 100),
    isActive,
  })

  revalidatePath("/dashboard/teachers")
}

export async function updateTeacher(id: string, formData: FormData) {
  await requireManageScope()
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const bio = String(formData.get("bio") ?? "").trim() || null
  const payPerClassThb = Number(formData.get("payPerClassThb") ?? 0)
  const isActive = formData.get("isActive") === "on"

  if (!name) throw new Error("Nome é obrigatório")

  await db
    .update(teachers)
    .set({
      name,
      email,
      phone,
      bio,
      payPerClassCents: Math.round(payPerClassThb * 100),
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
