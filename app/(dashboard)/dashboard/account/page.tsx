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
import { PageHeader } from "@/components/crm/page-header"
import { WeatherCard } from "@/components/crm/weather-card"
import { getKohPhanganWeather } from "@/lib/weather/koh-phangan"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const session = await requireDashboardSession()
  const weather = await getKohPhanganWeather()
  const initials =
    session.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?"

  return (
    <div className="space-y-6">
      <PageHeader
        title="My account"
        subtitle="Manage your profile and preferences."
      />

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

      <WeatherCard data={weather} />

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
