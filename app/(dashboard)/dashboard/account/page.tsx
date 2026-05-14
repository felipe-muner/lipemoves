import { requireDashboardSession } from "@/lib/auth/dashboard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AccountPreferences } from "@/components/crm/account-preferences"
import { SignOutButton } from "@/components/crm/sign-out-button"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const session = await requireDashboardSession()
  const initials =
    session.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your account info synced from Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={session.image ?? undefined}
                alt={session.name ?? ""}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="text-lg font-semibold">
                {session.name ?? "—"}
              </div>
              <div className="text-sm text-muted-foreground">
                {session.email}
              </div>
              <Badge variant="outline" className="capitalize">
                {session.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <AccountPreferences />

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>
            Sign out on this device. You can sign back in any time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  )
}
