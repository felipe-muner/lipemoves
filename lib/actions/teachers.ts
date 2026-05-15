"use server"

import { db } from "@/lib/db"
import { employees, roles, employeeRoles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission")
  }
  return session
}

async function teacherRoleId() {
  const [r] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, "teacher"))
    .limit(1)
  if (!r)
    throw new Error(
      "Teacher role not seeded — run pnpm crm:seed or insert into roles.",
    )
  return r.id
}

async function ensureTeacherRole(employeeId: string) {
  const roleId = await teacherRoleId()
  await db
    .insert(employeeRoles)
    .values({ employeeId, roleId })
    .onConflictDoNothing()
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

  const [created] = await db
    .insert(employees)
    .values({ name, email, phone, passport, bio, isActive })
    .returning()
  await ensureTeacherRole(created.id)

  revalidatePath("/dashboard/teachers")
  revalidatePath("/dashboard/employees")
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
    .update(employees)
    .set({
      name,
      email,
      phone,
      passport,
      bio,
      isActive,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(employees.id, id))
  await ensureTeacherRole(id)

  revalidatePath("/dashboard/teachers")
  revalidatePath("/dashboard/employees")
}

export async function deactivateTeacher(id: string) {
  await requireManageScope()
  await db
    .update(employees)
    .set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(employees.id, id))
  revalidatePath("/dashboard/teachers")
  revalidatePath("/dashboard/employees")
}

export async function reactivateTeacher(id: string) {
  await requireManageScope()
  await db
    .update(employees)
    .set({ isActive: true, updatedAt: new Date().toISOString() })
    .where(eq(employees.id, id))
  await ensureTeacherRole(id)
  revalidatePath("/dashboard/teachers")
  revalidatePath("/dashboard/employees")
}
