# LipeMoves: notes for Claude

Felipe Muner's site (Next.js 16 App Router, deployed by Vercel from `main`; a push
to `main` goes live on lipemoves.com, other branches only get a preview URL).
Felipe is a yoga / calisthenics / mobility coach. The big picture: sell 4-week
programs, one per body area.

## Programs: where we are (update this section as things change)

When Felipe says "continue the programs", "keep going with the clips" or similar,
read this section, then `assets/glossary/CLIPS_TABLE.md`, and carry on.

- **Body map** `/program` (`components/program/body-map.tsx`): tap a body area to
  open its program. Image: `public/programs/body-map/mannequin-front.jpg`.
- **Open Hips** is the only program for sale: `/hips` (sales page),
  `/hips/program` (buyer page, locked by `HIPS_ACCESS_CODES`; Felipe still has to
  add that env var on Vercel), `/program/hips` (printable plan, public).
- **7 draft programs** (written by Claude, Felipe has not reviewed them yet):
  shoulders, wrists, core, back, legs, knees, ankles. Content in
  `content/programs/<slug>.ts`, registry `content/programs/areas.ts`, page
  `/program/<slug>` (`components/program/area-program.tsx`) with a WhatsApp
  waitlist and "Video coming soon" until a clip exists.
- **Shot list** `/program/shot-list` (noindex): every exercise with its clip and
  filming cues, so Felipe can film himself. He plans to film the programs with
  his own face; the mannequin clips are the stopgap and a "muscle map" extra.

## Demo clips (mannequin with green muscle glow)

- How a run works: `assets/glossary/RUN_CLIPS.md` (single source of truth).
- Queues, one per program, priority order in `assets/glossary/queues.json`:
  `assets/glossary/<program>-queue.json` (template, prompts, status, attempts,
  notes, `source` = which tool/model made each clip).
- Overview table: `python3 scripts/clips/clips-table.py` writes
  `assets/glossary/CLIPS_TABLE.md`.
- Clip files: `public/programs/hips/clips/` + `content/programs/hips-clips.ts`
  for Hips; `public/programs/<program>/clips/` + `content/programs/program-clips.ts`
  for the rest.
- Tools: only what Felipe's existing Google AI Plus plan includes. Never use the
  paid API, buy credits or upgrade:
  1. Gemini app "Create video": about 2 videos per 5 hours.
  2. Google Flow, model **Omni 1.2 Flash** only (24 of 250 monthly credits per
     video, reset on the 8th). Veo 3.1 Lite gives a different style: never use it.
- Mission 1: every exercise gets a clip. Mission 2: remake them all with one model
  (or Felipe's own footage) so they look the same.
- Scheduling: Claude Code crons die with the session. `scripts/clips/install.sh`
  can install a launchd job (every 3 h, same "auto" permission mode); Felipe has
  not approved installing it yet.

## Felipe's own videos (coach clips)

Each exercise card can show two demos with a "Felipe | Muscles" switch
(`components/program/dual-clip.tsx`): Felipe's own video first, the mannequin
muscle map second. When Felipe sends his videos (AirDrop to ~/Downloads, named
by exercise slug as on `/program/shot-list`):
1. Encode each to `public/programs/<program>/coach/<slug>.mp4`:
   `ffmpeg -i in.mov -an -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart out.mp4`
   (trim to the reps if he left long pauses; check orientation first).
2. Add the line to `content/programs/coach-clips.ts` under the program.
3. Commit only those files.

## Open decisions for Felipe

- Clips that failed twice: accept as is, film himself, or skip (see the "wrong"
  rows in CLIPS_TABLE.md).
- Wall Deep Squat: back against the wall, or facing it?
- Go live with the body map and the 7 program previews (merge the
  `programs-body-map` branch into `main`).
- Add `HIPS_ACCESS_CODES` on Vercel so buyers can unlock `/hips/program`.

## Conventions

- Covers for YouTube/Instagram: `assets/covers/STYLE.md` (full-bleed photo, flat
  caps headline behind Felipe, never over his face).
- Commit only the files a change needs; end commit messages with the
  Co-Authored-By line. Ask before pushing to `main`.
