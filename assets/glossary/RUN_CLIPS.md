# Mannequin demo clips: how a scheduled run works

Felipe's programs (Open Hips plus the body-area programs on /program) get one
10-second demo clip per exercise, made in the Gemini web app through Claude in
Chrome. This file is the single prompt every scheduled run follows, whether it
is fired by a Claude Code cron or by the macOS launchd job
(`scripts/clips/run-clips.sh`).

## Order of work

Read `assets/glossary/queues.json`. It lists the programs in priority order.
Take the first program whose queue (`assets/glossary/<program>-queue.json`)
still has a clip with status "pending", then work through that queue.

For up to 3 clips this run, in order of "n", taking clips with status
"pending" (skip any whose "note" says to check with Felipe first, and any
with attempts >= max_attempts). When a queue has nothing left to do, move on
to the next program in queues.json within the same run.

1. Build the prompt from the queue's "template" by filling {view}, {start},
   {motion}, {glow}.
2. In Chrome (claude-in-chrome tools; call tabs_context_mcp first, use your own
   tab): open https://gemini.google.com/app as a NEW chat, open
   "Upload & tools" (if the + button ignores clicks, click
   `button[aria-label="Upload & tools"]` with JS), choose "Create video", type
   the prompt (JS: `.ql-editor` + `execCommand('insertText')`), set aspect ratio
   to Portrait (9:16), Format to Video, send. Text only: never attach an image,
   never continue an older video chat.
3. Wait (background `sleep 240`, then reload the chat URL) until the page says
   "Your video is ready!" or shows an error.
4. Check the result with an in-page contact sheet (seek to about 8 timestamps,
   draw each to a canvas in a fixed overlay, screenshot, remove the overlay).
   It is "ok" only if: about 10 s long, one mannequin, nobody else in frame, he
   stays in one position doing one movement with at most 3 repetitions, the
   movement matches the exercise, and the green glow is on the working muscles
   (including on the shorts when the muscle is under them). Otherwise "wrong"
   with a short reason.
5. Update that clip in its queue file: status ("ok" or "wrong", or keep
   "pending" if Gemini errored), attempts + 1 (not for Gemini errors),
   "chat" = the chat URL, "note" = what you saw, "source" = the tool and model
   ("Gemini app (Videos, model Auto)" or "Google Flow · Omni 1.2 Flash").
   At the end of the run, regenerate the overview with
   `python3 scripts/clips/clips-table.py` (assets/glossary/CLIPS_TABLE.md).
   A "wrong" clip goes back to
   "pending" only if attempts < max_attempts and you reword it for the retry.
6. For each ok clip (download_approved is true): click Gemini's
   "Download video" button, check the file in ~/Downloads with ffprobe
   (~10 s, 720x1280), copy it to `assets/glossary/<exercise-slug>-raw.mp4`,
   encode with
   `ffmpeg -i raw -an -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart <out>`
   - Open Hips: out = `public/programs/hips/clips/<slug>.mp4`, add the line to
     `content/programs/hips-clips.ts`.
   - Other programs: out = `public/programs/<program>/clips/<slug>.mp4`, add
     the line under the program in `content/programs/program-clips.ts`.
   Branch: commit on whatever branch is checked out. While the
   `programs-body-map` branch is not merged, push that branch (Vercel preview
   only); its clips reach lipemoves.com when Felipe says to go live and the
   branch is merged into `main`.
   Then `git add` only that mp4 and that clips file, commit
   ("Add <Exercise> demo clip to <Program>", ending with the Co-Authored-By
   line), `git push origin main`, and check the clip URL returns 200 on
   https://lipemoves.com.

## Second source: Google Flow (free monthly credits)

Felipe's Google AI Plus plan includes 250 Google Flow credits a month
(reset on the 8th). When Gemini says "out of videos", a run may continue in
Flow, as long as credits remain:
- https://flow.google.com → New project (dismiss the intro dialog with
  "Get started"), close the right agent panel, and turn OFF the Flow Agent
  switch in the prompt bar (direct generation).
- Settings chip in the prompt bar: Video, 9:16, model **Omni 1.2 Flash**
  (24 credits, 720p, 8 s, x1). Never use Veo 3.1 Lite: tested 2026-11-27, it
  draws red skinless muscles and a different style. Omni 1.2 Flash matched the
  Gemini clips.
- Paste the prompt into the `[contenteditable=true]` box and send. Open the
  clip, "Download media" → "720p Original size". Chrome saves it as a hidden
  `~/Downloads/.com.google.Chrome.*` file; check it with ffprobe (~8 s,
  720x1280) and continue from step 4/6 above.
- Stop using Flow when fewer than 24 credits are left (account menu shows the
  balance). Never buy credits or upgrade.

Stop the run early, without retrying, if Gemini says "something went wrong",
"unusually high traffic / at full capacity", mentions a limit or quota ("out
of videos"), or asks to sign in; also stop if the Chrome extension disconnects
twice. Log one line about the run in the hips queue's "run_rules". Do not spend
money, change plans, or accept any upgrade offer. Close your tab at the end.

End with a short report for Felipe: which clips were made, which are ok or
wrong, how many remain per program.
