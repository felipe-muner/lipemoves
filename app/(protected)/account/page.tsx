import { Suspense } from "react"
import AccountContent from "./account-content"

export const dynamic = "force-dynamic"

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  )
}
