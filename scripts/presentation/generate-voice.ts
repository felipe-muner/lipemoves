/**
 * Generates one MP3 per slide using macOS `say` and `afconvert`.
 * Outputs:
 *   public/presentation/audio/<slide-id>.mp3
 *   public/presentation/audio/durations.json  (mapping id → seconds)
 *
 * Run: pnpm tsx scripts/presentation/generate-voice.ts
 */

import { spawn } from "node:child_process"
import { mkdir, writeFile, stat, rm } from "node:fs/promises"
import path from "node:path"
import { slides } from "./slides"

const VOICE = process.env.SAY_VOICE ?? "Grandpa (English (US))"
const RATE = process.env.SAY_RATE ?? "180" // words per minute
const OUT = path.resolve(process.cwd(), "public/presentation/audio")

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stderr = ""
    p.stderr.on("data", (b) => (stderr += b.toString()))
    p.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}: ${stderr}`)),
    )
  })
}

async function probeDuration(file: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const p = spawn("afinfo", [file])
    let out = ""
    p.stdout.on("data", (b) => (out += b.toString()))
    p.on("close", (code) => {
      if (code !== 0) return reject(new Error("afinfo failed"))
      const m = out.match(/estimated duration:\s*([\d.]+)\s*sec/i)
      if (!m) return reject(new Error(`Could not parse duration from afinfo:\n${out}`))
      resolve(parseFloat(m[1]))
    })
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })

  console.log(`Voice: ${VOICE}`)
  console.log(`Rate:  ${RATE} wpm`)
  console.log("")

  const durations: Record<string, number> = {}

  for (const slide of slides) {
    const aiff = path.join(OUT, `${slide.id}.aiff`)
    const mp3 = path.join(OUT, `${slide.id}.mp3`)

    console.log(`→ ${slide.id}`)
    await run("say", ["-v", VOICE, "-r", RATE, "-o", aiff, slide.narration])

    try {
      await run("lame", ["--silent", aiff, mp3])
      await rm(aiff)
    } catch {
      const m4a = path.join(OUT, `${slide.id}.m4a`)
      await run("afconvert", ["-f", "m4af", "-d", "aac", aiff, m4a])
      await rm(aiff)
      await run("mv", [m4a, mp3])
    }

    const stats = await stat(mp3)
    if (stats.size === 0) throw new Error(`${mp3} is empty`)

    const duration = await probeDuration(mp3)
    durations[slide.id] = duration
    console.log(`   ${duration.toFixed(2)}s · ${(stats.size / 1024).toFixed(0)} KB`)
  }

  await writeFile(
    path.join(OUT, "durations.json"),
    JSON.stringify(durations, null, 2),
  )

  const total = Object.values(durations).reduce((a, b) => a + b, 0)
  console.log("")
  console.log(`✅ ${slides.length} clips · total ${total.toFixed(1)}s`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
