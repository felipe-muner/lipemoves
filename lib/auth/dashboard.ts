import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export type DashboardRole = "admin" | "manager" | "teacher"

export interface DashboardSession {
  userId: string
  email: string
  name: string | null
  image: string | null
  role: DashboardRole
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

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role,
  }
}
