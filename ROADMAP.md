# Roadmap

Planned work on Lipe Moves. GitHub issues #1–#13 track the individual items; this file is the
overview. Items are roughly in priority order.

## Reliability and quality

- [ ] Add an automated test suite (Vitest + React Testing Library) starting with auth,
      Stripe webhook handling and subscription gating of the video stream route.
- [ ] Add GitHub Actions CI: lint, typecheck, tests, `next build` on every PR.
- [ ] Add end-to-end smoke tests (Playwright) for register → subscribe → watch a video.
- [ ] Error monitoring and structured logging for API routes and webhooks.

## Product (member-facing)

- [ ] Finish the 4-week program experience: progress tracking per day, completion
      state, and reminders by email.
- [ ] Program and class search / filtering in the video library.
- [ ] Mobile layout pass on the timer, player and program pages.
- [ ] Member movement tracker: weekly summary view and export.

## Admin dashboard and content studio

- [ ] Studio: edit uploaded videos in the browser before posting (cover frame picker,
      trim, caption/label, preview), and improve cover generation.
- [ ] Move the studio render jobs off the local filesystem to a queue + Bunny upload so
      they can run on Vercel instead of only on my laptop.
- [ ] Turn `app/ebook` into a picker so each ebook title gets its own funnel.
- [ ] Consolidate the many `scripts/*.sh` ffmpeg helpers into one documented CLI.
- [ ] Carousel and reel templates driven by data files instead of per-slug pages.

## Housekeeping

- [ ] Remove tracked heavy media from `public/timer-days/` (already gitignored for new
      days) and host it on Bunny.
- [ ] Keep README pages/API tables in sync with the current routes.
- [ ] Upgrade dependencies on a regular cadence and document the Node / pnpm versions.
