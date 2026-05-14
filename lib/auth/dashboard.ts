import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { employees } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export type DashboardRole = "admin" | "manager" | "teacher"

export interface DashboardSession {
  userId: string
  email: string
  name: string | null
  image: string | null
  role: DashboardRole
  /** For teacher role: their teacher record id. */
  teacherId: string | null
}

export async function requireDashboardSession(): Promise<DashboardSession> {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role
  if (!role) {
    redirect("/")
  }

  let teacherId: string | null = null
  if (role === "teacher") {
    const [t] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, session.user.id))
      .limit(1)
    teacherId = t?.id ?? null
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role,
    teacherId,
  }
}
