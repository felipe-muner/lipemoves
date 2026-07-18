import type { Program, WorkoutDay, Exercise } from "@/content/programs/hips"

const PROGRAM_CSS = `
.prog-root { --bg: #0a0a0a; --card: #2b2b2b; --card-2: #333; --bar: #1c1c1c; --yellow: #f2e600; --cyan: #4fd8e8; --red: #ff2d2d; --value: #ff5a3c; --white: #fff; }
.prog-root { font-family: 'Helvetica Neue', 'Inter', Arial, sans-serif; background: #1e1e1e; padding: 20px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.prog-root * { box-sizing: border-box; margin: 0; padding: 0; }
.prog-root a { text-decoration: none; color: inherit; }

.prog-root .page { width: 210mm; min-height: 297mm; position: relative; overflow: hidden; background: var(--bg); box-shadow: 0 4px 24px rgba(0,0,0,.5); padding: 16mm 14mm; }

.prog-root .day-title { text-align: center; color: var(--cyan); font-style: italic; font-weight: 800; font-size: 30pt; letter-spacing: 8px; text-transform: uppercase; margin-bottom: 10mm; }

.prog-root .warmup { display: flex; justify-content: center; margin-bottom: 12mm; }
.prog-root .warmup .pill { display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(180deg, #f2f2f2 0%, #bdbdbd 100%); color: #111; font-style: italic; font-weight: 800; font-size: 13pt; letter-spacing: 3px; padding: 7px 10px 7px 22px; border-radius: 999px; box-shadow: 0 2px 6px rgba(0,0,0,.5); }

.prog-root .play { width: 34px; height: 34px; border-radius: 50%; background: var(--red); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.prog-root .play svg { width: 14px; height: 14px; fill: #fff; margin-left: 2px; }

.prog-root .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm 6mm; }

.prog-root .card .head { display: flex; align-items: stretch; gap: 6px; margin-bottom: 6px; }
.prog-root .card .num { background: var(--yellow); color: #000; font-weight: 800; font-size: 13pt; display: flex; align-items: center; justify-content: center; width: 46px; border-radius: 3px; }
.prog-root .card .name { flex: 1; background: var(--card); color: var(--white); font-style: italic; font-weight: 800; font-size: 14pt; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; text-align: center; border-radius: 3px; padding: 8px 10px; }

.prog-root .card .stats { display: flex; align-items: center; justify-content: space-between; background: var(--bar); border-radius: 3px; padding: 8px 18px; margin-bottom: 8px; }
.prog-root .card .stats .k { color: var(--white); font-weight: 700; font-size: 10.5pt; letter-spacing: 2px; text-transform: capitalize; }
.prog-root .card .stats .v { color: var(--value); font-style: italic; font-weight: 800; font-size: 11pt; }

.prog-root .card .media { position: relative; width: 100%; aspect-ratio: 1 / 1; background: #3a3a3a; border-radius: 4px; overflow: hidden; display: block; }
.prog-root .card .media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.prog-root .card .media .ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 9pt; letter-spacing: 2px; text-transform: uppercase; }
.prog-root .card .media .play { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 54px; height: 54px; box-shadow: 0 2px 10px rgba(0,0,0,.5); }
.prog-root .card .media .play svg { width: 22px; height: 22px; }

@media print {
  @page { size: A4; margin: 0; }
  .prog-root { background: #fff; padding: 0; gap: 0; }
  .prog-root .page { box-shadow: none; break-after: page; }
}
`

function PlayIcon() {
  return (
    <span className="play">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  )
}

function Card({ ex, slug }: { ex: Exercise; slug: string }) {
  const media = (
    <>
      {ex.photo ? (
        <img src={`/programs/${slug}/${ex.photo}`} alt={ex.name} />
      ) : (
        <span className="ph">Photo</span>
      )}
      <PlayIcon />
    </>
  )
  return (
    <div className="card">
      <div className="head">
        <div className="num">{ex.n}</div>
        <div className="name">{ex.name}</div>
      </div>
      <div className="stats">
        <span className="k">Sets</span>
        <span className="v">{ex.sets}</span>
        <span className="k">{ex.time ? "Time" : "Reps"}</span>
        <span className="v">{ex.time ?? ex.reps}</span>
      </div>
      {ex.youtube ? (
        <a className="media" href={ex.youtube} target="_blank" rel="noopener noreferrer">
          {media}
        </a>
      ) : (
        <div className="media">{media}</div>
      )}
    </div>
  )
}

function DayPage({ day, slug }: { day: WorkoutDay; slug: string }) {
  return (
    <div className="page">
      <div className="day-title">
        Week {day.week} Day {day.day}
      </div>
      <div className="warmup">
        {day.warmupYoutube ? (
          <a className="pill" href={day.warmupYoutube} target="_blank" rel="noopener noreferrer">
            Warm Up <PlayIcon />
          </a>
        ) : (
          <span className="pill">
            Warm Up <PlayIcon />
          </span>
        )}
      </div>
      <div className="grid">
        {day.exercises.map((ex) => (
          <Card key={ex.n} ex={ex} slug={slug} />
        ))}
      </div>
    </div>
  )
}

export function ProgramRenderer({ program }: { program: Program }) {
  return (
    <div className="prog-root">
      <style dangerouslySetInnerHTML={{ __html: PROGRAM_CSS }} />
      {program.days.map((day) => (
        <DayPage key={`${day.week}-${day.day}`} day={day} slug={program.slug} />
      ))}
    </div>
  )
}
