import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core"

// ─── Enums ───────────────────────────────────────────────
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "incomplete",
])

export const userRoleEnum = pgEnum("user_role", ["admin"])

// ─── Users ───────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified"),
  hashedPassword: text("hashed_password"),
  image: text("image"),
  role: userRoleEnum("role"),
  /** Public handle for shareable pages like /training/<slug>. Null = private. */
  publicSlug: varchar("public_slug", { length: 60 }).unique(),
  /** Short bio shown on the public training page. */
  publicBio: text("public_bio"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

// ─── Accounts (OAuth) ────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
})

// ─── Sessions ────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
})

// ─── Verification Tokens ────────────────────────────────
export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
})

// ─── Subscriptions ───────────────────────────────────────
// Holds both Stripe-driven subscriptions (source="stripe") and manually-added
// offline memberships like 1×1 coaching (source="manual"), so Members and
// Finance have a single source of truth.
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** "stripe" | "manual" */
  source: varchar("source", { length: 20 }).notNull().default("stripe"),
  // Stripe fields — null for manual memberships.
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  // Manual-membership fields (null for Stripe rows).
  /** "one_to_one" | "monthly" | "annual" — used when source="manual". */
  plan: varchar("plan", { length: 30 }),
  amountCents: integer("amount_cents"),
  currency: varchar("currency", { length: 10 }),
  /** "month" | "year" | "one_time" — billing cadence for manual rows. */
  billingInterval: varchar("billing_interval", { length: 10 }),
  note: text("note"),
  status: subscriptionStatusEnum("status").notNull().default("incomplete"),
  currentPeriodStart: timestamp("current_period_start", { mode: "string" }),
  currentPeriodEnd: timestamp("current_period_end", { mode: "string" }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

/** One row per successful charge — Stripe invoices and manual payments. */
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
    onDelete: "set null",
  }),
  /** "stripe" | "manual" */
  source: varchar("source", { length: 20 }).notNull().default("stripe"),
  /** Idempotency key for Stripe webhooks — null for manual payments. */
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }).unique(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  /** "monthly" | "annual" | "one_to_one" | "unknown" */
  plan: varchar("plan", { length: 30 }),
  // timestamptz: stored as UTC, rendered in the viewer's timezone client-side.
  paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
})

// ─── Categories ──────────────────────────────────────────
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

// ─── Videos ──────────────────────────────────────────────
export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  bunnyVideoId: varchar("bunny_video_id", { length: 255 }).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  durationSeconds: integer("duration_seconds"),
  /** Searchable tags, e.g. ["hip", "shoulder", "kettlebell"]. */
  tags: text("tags").array(),
  isFree: boolean("is_free").default(false),
  isPublished: boolean("is_published").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

// ─── Email Subscribers (newsletter / ebook leads) ────────
export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "active",
  "unsubscribed",
  "bounced",
  "complained",
])

export const emailSubscribers = pgTable("email_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  status: subscriberStatusEnum("status").notNull().default("active"),
  source: varchar("source", { length: 100 }),
  unsubscribeToken: uuid("unsubscribe_token").defaultRandom().notNull().unique(),
  subscribedAt: timestamp("subscribed_at", { mode: "string" }).defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at", { mode: "string" }),
})

// ─── Model Applications (people who want to appear in videos) ─────
export const modelApplicationStatusEnum = pgEnum("model_application_status", [
  "new",
  "contacted",
  "approved",
  "rejected",
])

export const modelApplications = pgTable("model_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  /** Full phone in E.164-ish form, e.g. "+66812345678". */
  phone: varchar("phone", { length: 40 }).notNull(),
  /** ISO 3166-1 alpha-2 of the chosen dial code, e.g. "TH". */
  phoneCountry: varchar("phone_country", { length: 2 }),
  // Social handles — each optional, stored separately. At least one required.
  whatsapp: varchar("whatsapp", { length: 255 }),
  instagram: varchar("instagram", { length: 255 }),
  telegram: varchar("telegram", { length: 255 }),
  tiktok: varchar("tiktok", { length: 255 }),
  youtube: varchar("youtube", { length: 255 }),
  facebook: varchar("facebook", { length: 255 }),
  email: varchar("email", { length: 255 }),
  notes: text("notes"),
  /** Their pitch — why we should feature them. */
  whyChooseUs: text("why_choose_us"),
  status: modelApplicationStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})
