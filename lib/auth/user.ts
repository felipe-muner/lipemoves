import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export interface AppUser {
  userId: string
  email: string
  name: string | null
  image: string | null
  role: "admin" | null
}

/**
 * Requires any signed-in user — no role gate. Use for the customer-facing
 * movement tracker (/me) and the server actions it shares with the admin
 * dashboard. Admins pass this too, so the same actions serve both surfaces.
 * Redirects to /login (returning to `callbackUrl`) when there is no session.
 */
export async function requireUser(callbackUrl = "/me"): Promise<AppUser> {
  const session = await auth()
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: session.user.role ?? null,
  }
}
