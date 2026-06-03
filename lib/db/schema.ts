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

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "manager",
  "teacher",
])

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

// ─── Digital Products (one-time PDFs, etc.) ──────────────
export const digitalProducts = pgTable("digital_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("brl"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

export const digitalPurchases = pgTable("digital_purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => digitalProducts.id, { onDelete: "restrict" }),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  downloadToken: uuid("download_token").defaultRandom().notNull().unique(),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }).unique(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  amountPaidCents: integer("amount_paid_cents").notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  downloadCount: integer("download_count").notNull().default(0),
  maxDownloads: integer("max_downloads").notNull().default(10),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  deliveredAt: timestamp("delivered_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})
