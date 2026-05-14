"use server"

import { db } from "@/lib/db"
import {
  employees,
  employeeRoles,
  employeeTeams,
  roles,
  teams,
  sales,
} from "@/lib/db/schema"
import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { startOfMonth, formatISO } from "date-fns"
import { revalidatePath } from "next/cache"
import { requireDashboardSession } from "@/lib/auth/dashboard"

async function requireManageScope() {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("No permission")
  }
  return session
}

function readEmployeeFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const passport = String(formData.get("passport") ?? "").trim() || null
  const bio = String(formData.get("bio") ?? "").trim() || null
  const isActive = formData.get("isActive") === "on"
  const roleIds = (formData.getAll("roleId") as string[]).filter(Boolean)
  const teamIds = (formData.getAll("teamId") as string[]).filter(Boolean)
  if (!name) throw new Error("Name is required")
  if (!email) throw new Error("Email is required")
  return { name, email, phone, passport, bio, isActive, roleIds, teamIds }
}

async function syncRoles(employeeId: string, roleIds: string[]) {
  await db.delete(employeeRoles).where(eq(employeeRoles.employeeId, employeeId))
  if (roleIds.length > 0) {
    await db
      .insert(employeeRoles)
      .values(roleIds.map((roleId) => ({ employeeId, roleId })))
  }
}

async function syncTeams(employeeId: string, teamIds: string[]) {
  await db.delete(employeeTeams).where(eq(employeeTeams.employeeId, employeeId))
  if (teamIds.length > 0) {
    await db
      .insert(employeeTeams)
      .values(teamIds.map((teamId) => ({ employeeId, teamId })))
  }
}

export async function createEmployee(formData: FormData) {
  await requireManageScope()
  const { roleIds, teamIds, ...fields } = readEmployeeFields(formData)
  const [created] = await db.insert(employees).values(fields).returning()
  await syncRoles(created.id, roleIds)
  await syncTeams(created.id, teamIds)
  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/teachers")
}

export async function updateEmployee(id: string, formData: FormData) {
  await requireManageScope()
  const { roleIds, teamIds, ...fields } = readEmployeeFields(formData)
  await db
    .update(employees)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(eq(employees.id, id))
  await syncRoles(id, roleIds)
  await syncTeams(id, teamIds)
  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/teachers")
}

export async function deleteEmployee(id: string) {
  await requireManageScope()
  await db.delete(employees).where(eq(employees.id, id))
  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/teachers")
}

// ─── Roles ────────────────────────────────────────────────
export async function createRole(formData: FormData) {
  await requireManageScope()
  const name = String(formData.get("name") ?? "").trim()
  const slug = (
    String(formData.get("slug") ?? "").trim() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
  ).slice(0, 50)
  const color = String(formData.get("color") ?? "#a78bfa")
  const description = String(formData.get("description") ?? "").trim() || null
  if (!name || !slug) throw new Error("Name is required")
  await db.insert(roles).values({ name, slug, color, description })
  revalidatePath("/dashboard/employees")
}

export async function updateRole(id: string, formData: FormData) {
  await requireManageScope()
  const name = String(formData.get("name") ?? "").trim()
  const color = String(formData.get("color") ?? "#a78bfa")
  const description = String(formData.get("description") ?? "").trim() || null
  if (!name) throw new Error("Name is required")
  await db.update(roles).set({ name, color, description }).where(eq(roles.id, id))
  revalidatePath("/dashboard/employees")
}

export async function deleteRole(id: string) {
  await requireManageScope()
  const [r] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)
  if (r?.isSystem) throw new Error("System role can't be deleted")
  await db.delete(roles).where(eq(roles.id, id))
  revalidatePath("/dashboard/employees")
}

// ─── Teams ────────────────────────────────────────────────
export async function createTeam(formData: FormData) {
  await requireManageScope()
  const name = String(formData.get("name") ?? "").trim()
  const slug = (
    String(formData.get("slug") ?? "").trim() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
  ).slice(0, 50)
  const color = String(formData.get("color") ?? "#38bdf8")
  const description = String(formData.get("description") ?? "").trim() || null
  if (!name || !slug) throw new Error("Name is required")
  await db.insert(teams).values({ name, slug, color, description })
  revalidatePath("/dashboard/employees")
}

export async function updateTeam(id: string, formData: FormData) {
  await requireManageScope()
  const name = String(formData.get("name") ?? "").trim()
  const color = String(formData.get("color") ?? "#38bdf8")
  const description = String(formData.get("description") ?? "").trim() || null
  if (!name) throw new Error("Name is required")
  await db.update(teams).set({ name, color, description }).where(eq(teams.id, id))
  revalidatePath("/dashboard/employees")
}

export async function deleteTeam(id: string) {
  await requireManageScope()
  await db.delete(teams).where(eq(teams.id, id))
  revalidatePath("/dashboard/employees")
}

export async function employeeListWithRoleTeam() {
  const rows = await db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      phone: employees.phone,
      passport: employees.passport,
      isActive: employees.isActive,
    })
    .from(employees)
    .orderBy(employees.createdAt)

  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const rolesByEmployee = await db
    .select({
      employeeId: employeeRoles.employeeId,
      roleId: roles.id,
      roleName: roles.name,
      roleColor: roles.color,
    })
    .from(employeeRoles)
    .innerJoin(roles, eq(roles.id, employeeRoles.roleId))
    .where(inArray(employeeRoles.employeeId, ids))

  const teamsByEmployee = await db
    .select({
      employeeId: employeeTeams.employeeId,
      teamId: teams.id,
      teamName: teams.name,
      teamColor: teams.color,
    })
    .from(employeeTeams)
    .innerJoin(teams, eq(teams.id, employeeTeams.teamId))
    .where(inArray(employeeTeams.employeeId, ids))

  // This-month sales totals per employee (waiter stats reuse the same query)
  const monthStartIso = formatISO(startOfMonth(new Date()))
  const salesByEmployee = await db
    .select({
      employeeId: sales.employeeId,
      saleCount: sql<number>`count(${sales.id})::int`,
      totalThb: sql<number>`coalesce(sum(${sales.totalThb}), 0)::int`,
    })
    .from(sales)
    .where(
      and(eq(sales.status, "paid"), gte(sales.paidAt, monthStartIso)),
    )
    .groupBy(sales.employeeId)
  const salesMap = new Map(
    salesByEmployee.map((s) => [s.employeeId ?? "", s]),
  )

  return rows.map((r) => ({
    ...r,
    roles: rolesByEmployee
      .filter((x) => x.employeeId === r.id)
      .map((x) => ({ id: x.roleId, name: x.roleName, color: x.roleColor })),
    teams: teamsByEmployee
      .filter((x) => x.employeeId === r.id)
      .map((x) => ({ id: x.teamId, name: x.teamName, color: x.teamColor })),
    monthlySales: {
      count: salesMap.get(r.id)?.saleCount ?? 0,
      totalThb: salesMap.get(r.id)?.totalThb ?? 0,
    },
  }))
}
