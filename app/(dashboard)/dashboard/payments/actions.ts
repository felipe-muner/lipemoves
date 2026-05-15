"use server"

import { requireDashboardSession } from "@/lib/auth/dashboard"
import { db } from "@/lib/db"
import { yogaClasses } from "@/lib/db/schema"
import { and, eq, gte, inArray, isNull, lte, isNotNull } from "drizzle-orm"
import { formatISO } from "date-fns"
import { revalidatePath } from "next/cache"

export async function markClassesPaid(formData: FormData) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("forbidden")
  }

  const ids = formData.getAll("classId").map((v) => String(v))
  if (ids.length === 0) return

  await db
    .update(yogaClasses)
    .set({ paidAt: formatISO(new Date()) })
    .where(inArray(yogaClasses.id, ids))

  revalidatePath("/dashboard/payments")
}

export async function markTeacherUnpaidPaid(formData: FormData) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("forbidden")
  }

  const teacherId = String(formData.get("teacherId") ?? "")
  const from = String(formData.get("from") ?? "")
  const to = String(formData.get("to") ?? "")
  if (!teacherId || !from || !to) return

  await db
    .update(yogaClasses)
    .set({ paidAt: formatISO(new Date()) })
    .where(
      and(
        eq(yogaClasses.employeeId, teacherId),
        gte(yogaClasses.scheduledAt, from),
        lte(yogaClasses.scheduledAt, to),
        isNull(yogaClasses.paidAt),
        isNotNull(yogaClasses.employeeId),
      ),
    )

  revalidatePath("/dashboard/payments")
}

export async function unmarkClassPaid(formData: FormData) {
  const session = await requireDashboardSession()
  if (session.role !== "admin" && session.role !== "manager") {
    throw new Error("forbidden")
  }

  const id = String(formData.get("classId") ?? "")
  if (!id) return

  await db.update(yogaClasses).set({ paidAt: null }).where(eq(yogaClasses.id, id))
  revalidatePath("/dashboard/payments")
}
