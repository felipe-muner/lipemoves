# Lipe Moves

**Live:** https://lipemoves.com · **Code:** https://github.com/felipe-muner/lipemoves

Lipe Moves is the website and back office for my one-person movement coaching business
(yoga, acrobatics, mobility). It is the platform I actually run the business on:
students sign up, subscribe (Stripe), watch streamed classes (Bunny.net), and follow
printable programs; I use the admin dashboard to manage members and payments, track my own
training, and produce Instagram content (reels, carousels, ebooks) with Remotion and
ffmpeg-based scripts.

**Who it's for:** my students and subscribers (public pages), and me as the sole admin
(dashboard + content studio). It is also a reference for anyone building a small
creator-run subscription site on this stack.

**Tech stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui ·
NextAuth v5 · Stripe · Bunny.net Stream · Resend · Drizzle ORM · PostgreSQL (Neon) ·
Remotion · deployed on Vercel.

## Why this exists

At 30 my body was dysfunctional. Like most people raised in Western society I had been in a
chair since kindergarten: school, university, then the office. Sitting destroys our body
functions slowly, day by day, and by the time we notice we are in real pain with zero idea
how to revert it. Too often the answer is to treat the consequence instead of the root
cause: doctors, many of them without a movement practice of their own, hand out a surgery,
and the body stays broken because only the symptom was fixed.

I was lucky to get consistent with mobility and yoga practice at 30, when my body was at
its worst. Today, at 36, I can do the splits, and I have the best body of my life. That
journey is what Lipe Moves is built on.

It is becoming a complete glossary of movement: everything we should know to have a better
life experience in our body, build a stronger one, and stop damaging it while working,
studying or sitting all day. Short, consistent practice (programs, the timer, the streamed
classes) plus the knowledge to keep the body an instrument of expression, not a thing you
carry to a desk.

**Status:** solo project, in production since March 2026 with paying subscribers.
Planned work is in [ROADMAP.md](./ROADMAP.md).

---

## Local Development

### 1. Start the database

```bash
docker compose up -d
```

This starts a local Postgres on port 5432 with user/password/db all set to `lipemoves`.

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

**Minimum to run locally:**

| Variable | How to get it |
|---|---|
| `DATABASE_URL` | Already set if using Docker: `postgresql://lipemoves:lipemoves@localhost:5432/lipemoves` |
| `AUTH_SECRET` | Run `openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000` |

Everything else can stay empty — features degrade gracefully:
- No `GOOGLE_*` — Google login button won't work
- No `STRIPE_*` — Checkout/subscription won't work
- No `BUNNY_*` — Video streaming won't work

### 4. Push the schema to the database

```bash
pnpm drizzle-kit push
```

### 5. Run the dev server

```bash
pnpm dev
```

Open http://localhost:3000

---

## Production (Vercel)

Set **all** env vars in the Vercel dashboard (Settings > Environment Variables):

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [Neon](https://neon.tech) — create a project, copy the connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://lipemoves.com` |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — create OAuth 2.0 client |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) — secret key |
| `STRIPE_PUBLISHABLE_KEY` | Same page — publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe > Developers > Webhooks — create endpoint pointing to `https://lipemoves.com/api/stripe/webhook` |
| `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` | Stripe > Products — create a product with monthly recurring price (R$49), copy the price ID (`price_xxx`) |
| `NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID` | Same product, add annual price (R$490), copy the price ID |
| `BUNNY_LIBRARY_ID` | [Bunny.net](https://dash.bunny.net) — Stream > your library > Library ID |
| `BUNNY_API_KEY` | Bunny.net > Account > API Key |
| `BUNNY_CDN_HOSTNAME` | Bunny.net > Stream > your library > CDN Hostname (e.g. `vz-abc123.b-cdn.net`) |
| `BUNNY_TOKEN_KEY` | Bunny.net > Stream > your library > Security > Token Authentication Key |

After setting env vars, push to `main` and Vercel will auto-deploy.

For the Neon production database, push the schema:

```bash
DATABASE_URL="your-neon-connection-string" pnpm drizzle-kit push
```

---

## Pages

### Public

| Route | Description |
|---|---|
| `/` | Landing page — hero, about, categories, pricing preview, footer |
| `/login` | Email/password login + Google OAuth |
| `/register` | Create account form + Google OAuth |
| `/pricing` | Monthly (R$49/mo) and Annual (R$490/yr) plan selection, initiates Stripe checkout |

### Protected (require login)

| Route | Description |
|---|---|
| `/videos` | Video library — grid organized by category, shows watch progress per video |
| `/videos/[slug]` | Video player — HLS streaming via Bunny.net, auto-saves progress every 10s. Paid videos require active subscription |
| `/account` | User info, manage subscription (Stripe billing portal), sign out |

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler (login, OAuth, session) |
| `/api/auth/register` | POST | Create new user (email + bcrypt password) |
| `/api/stripe/checkout` | POST | Create Stripe checkout session for subscription |
| `/api/stripe/webhook` | POST | Handle Stripe events (checkout completed, subscription updated/deleted) |
| `/api/stripe/portal` | POST | Open Stripe billing portal for subscription management |
| `/api/videos/[videoId]/stream` | GET | Returns signed Bunny.net HLS URL (checks auth + subscription) |
| `/api/videos/[videoId]/progress` | GET/POST | Read/save video watch progress |

---

## Database

PostgreSQL with Drizzle ORM. Schema at `lib/db/schema.ts`.

**Tables:** users, accounts, sessions, verificationTokens, subscriptions, categories, videos, watchProgress

```bash
pnpm drizzle-kit push    # Push schema to database
pnpm drizzle-kit studio  # Open Drizzle Studio (database GUI)
```

---

## Stripe Webhook Events

The webhook at `/api/stripe/webhook` handles:

- `checkout.session.completed` — creates subscription record
- `customer.subscription.updated` — updates status/period
- `customer.subscription.deleted` — marks as canceled

---

## Project map

| Area | Where |
|---|---|
| Public site (landing, pricing, start, timer, ebooks, programs, guides, carousels) | `app/(marketing)`, `app/start`, `app/ebooks`, `app/program`, `app/guides`, `app/carousel` |
| Auth (login, register, password reset) | `app/(auth)`, `lib/auth` |
| Member area (video library, player, account, personal tracker) | `app/(protected)`, `app/me` |
| Admin dashboard (members, payments, finance, subscribers, videos, content studio) | `app/(dashboard)/dashboard`, `lib/actions` |
| API routes (Stripe, Bunny webhooks, studio jobs, newsletter) | `app/api` |
| Database schema + migrations | `lib/db/schema.ts`, `drizzle/` |
| Video / reel rendering | `remotion/`, `scripts/*.sh` |
| Email templates | `lib/email` |

## Testing

There is no automated test suite yet (see the roadmap). Manual smoke scripts live in
`scripts/test-checkout.ts` and `scripts/test-video-playback.ts`.

## License

Code is released under the [MIT License](./LICENSE).

Media assets in `public/` (photos, ebook PDFs, rendered videos) are my own work and are
provided for running the site; the background music tracks in
`public/presentation/music/library` are royalty-free third-party tracks and keep their
original licenses.
