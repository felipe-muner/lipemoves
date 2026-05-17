// Koh Phangan / Haad Rin weather + marine via Open-Meteo (free, no key).
// Cached for 30 minutes — all users share the same response.
const HAAD_RIN = { lat: 9.6701, lon: 100.0703 } as const

const CACHE_SECONDS = 1800

export interface KohPhanganWeather {
  fetchedAt: string
  current: {
    temperatureC: number
    apparentTemperatureC: number
    precipitationMmH: number
    cloudCoverPct: number
    windSpeedKmh: number
    windGustKmh: number
    windDirectionDeg: number
    isDay: boolean
    weatherCode: number
  }
  marine: {
    waveHeightM: number
    wavePeriodSec: number
    waveDirectionDeg: number
    swellHeightM: number | null
  }
  daily: {
    precipitationSumMm: number
    precipitationProbabilityMax: number
    weatherCode: number
  }
}

interface ForecastResponse {
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    precipitation: number
    cloud_cover: number
    wind_speed_10m: number
    wind_gusts_10m: number
    wind_direction_10m: number
    is_day: number
    weather_code: number
  }
  daily: {
    precipitation_sum: number[]
    precipitation_probability_max: number[]
    weather_code: number[]
  }
}

interface MarineResponse {
  current: {
    wave_height: number
    wave_period: number
    wave_direction: number
    swell_wave_height: number | null
  }
}

export async function getKohPhanganWeather(): Promise<KohPhanganWeather | null> {
  try {
    const [forecast, marine] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${HAAD_RIN.lat}&longitude=${HAAD_RIN.lon}&current=temperature_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,is_day,weather_code&daily=precipitation_sum,precipitation_probability_max,weather_code&timezone=Asia%2FBangkok&forecast_days=1&wind_speed_unit=kmh`,
        { next: { revalidate: CACHE_SECONDS } },
      ),
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${HAAD_RIN.lat}&longitude=${HAAD_RIN.lon}&current=wave_height,wave_period,wave_direction,swell_wave_height&timezone=Asia%2FBangkok`,
        { next: { revalidate: CACHE_SECONDS } },
      ),
    ])

    if (!forecast.ok || !marine.ok) return null

    const f = (await forecast.json()) as ForecastResponse
    const m = (await marine.json()) as MarineResponse

    return {
      fetchedAt: new Date().toISOString(),
      current: {
        temperatureC: f.current.temperature_2m,
        apparentTemperatureC: f.current.apparent_temperature,
        precipitationMmH: f.current.precipitation,
        cloudCoverPct: f.current.cloud_cover,
        windSpeedKmh: f.current.wind_speed_10m,
        windGustKmh: f.current.wind_gusts_10m,
        windDirectionDeg: f.current.wind_direction_10m,
        isDay: f.current.is_day === 1,
        weatherCode: f.current.weather_code,
      },
      marine: {
        waveHeightM: m.current.wave_height,
        wavePeriodSec: m.current.wave_period,
        waveDirectionDeg: m.current.wave_direction,
        swellHeightM: m.current.swell_wave_height,
      },
      daily: {
        precipitationSumMm: f.daily.precipitation_sum[0] ?? 0,
        precipitationProbabilityMax: f.daily.precipitation_probability_max[0] ?? 0,
        weatherCode: f.daily.weather_code[0] ?? 0,
      },
    }
  } catch {
    return null
  }
}

/** WMO weather-code → label + emoji. */
export function describeWeather(code: number, isDay = true): { label: string; emoji: string } {
  if (code === 0) return { label: "Clear", emoji: isDay ? "☀️" : "🌙" }
  if (code <= 2) return { label: "Mostly clear", emoji: isDay ? "🌤️" : "🌙" }
  if (code === 3) return { label: "Cloudy", emoji: "☁️" }
  if (code >= 45 && code <= 48) return { label: "Foggy", emoji: "🌫️" }
  if (code >= 51 && code <= 57) return { label: "Drizzle", emoji: "🌦️" }
  if (code >= 61 && code <= 67) return { label: "Rain", emoji: "🌧️" }
  if (code >= 71 && code <= 77) return { label: "Snow", emoji: "❄️" }
  if (code >= 80 && code <= 82) return { label: "Showers", emoji: "🌧️" }
  if (code >= 95) return { label: "Thunderstorm", emoji: "⛈️" }
  return { label: "—", emoji: "🌡️" }
}

/** Surf-friendly label for wave height (meters). */
export function describeWaves(heightM: number): { label: string; tone: "calm" | "small" | "moderate" | "big" } {
  if (heightM < 0.3) return { label: "Flat", tone: "calm" }
  if (heightM < 0.6) return { label: "Small", tone: "small" }
  if (heightM < 1.0) return { label: "Moderate", tone: "moderate" }
  return { label: "Big", tone: "big" }
}

/** Compass direction from degrees. */
export function degToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round(deg / 45) % 8]
}
