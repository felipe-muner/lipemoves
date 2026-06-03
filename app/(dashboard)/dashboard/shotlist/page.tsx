import { requireDashboardSession } from "@/lib/auth/dashboard"
import { ShotlistBoard } from "@/components/crm/shotlist-board"

export const dynamic = "force-dynamic"

export default async function ShotlistPage() {
  await requireDashboardSession()
  return <ShotlistBoard />
}
