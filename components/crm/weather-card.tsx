import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { CloudRain, ExternalLink, Waves, Wind } from "lucide-react"
import {
  describeWaves,
  describeWeather,
  degToCompass,
  type KohPhanganWeather,
} from "@/lib/weather/koh-phangan"

const WINDGURU_URL = "https://www.windguru.cz/121272"

const TONE_CLASS: Record<
  ReturnType<typeof describeWaves>["tone"],
  string
> = {
  calm: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  small: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  moderate:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  big: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
}

export function WeatherCard({ data }: { data: KohPhanganWeather | null }) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Koh Phangan weather</CardTitle>
          <CardDescription>
            Couldn&apos;t reach the weather service. Try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const weather = describeWeather(data.current.weatherCode, data.current.isDay)
  const waves = describeWaves(data.marine.waveHeightM)
  const fetched = format(parseISO(data.fetchedAt), "HH:mm")

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Koh Phangan · Haad Rin</CardTitle>
          <CardDescription>
            Live from Open-Meteo · updated {fetched} · refreshes every 30 min
          </CardDescription>
        </div>
        <a
          href={WINDGURU_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Windguru
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardHeader>
      <CardContent>
        <CompactStrip data={data} weather={weather} waves={waves} />
      </CardContent>
    </Card>
  )
}

// ─── Layout 1 ──────────────────────────────────────────────
// Single horizontal row of pills — minimal footprint.
function CompactStrip({
  data,
  weather,
  waves,
}: {
  data: KohPhanganWeather
  weather: ReturnType<typeof describeWeather>
  waves: ReturnType<typeof describeWaves>
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill icon={<span className="text-base">{weather.emoji}</span>}>
        {weather.label} · {Math.round(data.current.temperatureC)}°C
      </Pill>
      <Pill icon={<CloudRain className="h-3.5 w-3.5" />}>
        {data.current.precipitationMmH.toFixed(1)} mm/h ·{" "}
        {data.daily.precipitationProbabilityMax}% today
      </Pill>
      <Pill icon={<Wind className="h-3.5 w-3.5" />}>
        {Math.round(data.current.windSpeedKmh)} km/h{" "}
        {degToCompass(data.current.windDirectionDeg)}
      </Pill>
      <Badge variant="outline" className={TONE_CLASS[waves.tone]}>
        <Waves className="mr-1 h-3 w-3" />
        Waves {waves.label} · {data.marine.waveHeightM.toFixed(1)} m
      </Badge>
    </div>
  )
}

// ─── Small building blocks ─────────────────────────────────
function Pill({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs">
      {icon}
      {children}
    </span>
  )
}

