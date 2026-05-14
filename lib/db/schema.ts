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

export const membershipTypeEnum = pgEnum("membership_type", [
  "drop_in",
  "monthly",
])

export const teacherPaymentStatusEnum = pgEnum("teacher_payment_status", [
  "pending",
  "paid",
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
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
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

// ─── Watch Progress ──────────────────────────────────────
export const watchProgress = pgTable("watch_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoId: uuid("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  progressSeconds: integer("progress_seconds").default(0),
  completed: boolean("completed").default(false),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

// ─── Email Marketing ─────────────────────────────────────
export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "active",
  "unsubscribed",
  "bounced",
  "complained",
])

export const emailSendStatusEnum = pgEnum("email_send_status", [
  "queued",
  "sent",
  "failed",
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

export const emailSequences = pgTable("email_sequences", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

export const emailSequenceSteps = pgTable("email_sequence_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  sequenceId: uuid("sequence_id")
    .notNull()
    .references(() => emailSequences.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  delayHours: integer("delay_hours").notNull().default(24),
  subject: varchar("subject", { length: 255 }).notNull(),
  preheader: varchar("preheader", { length: 255 }),
  bodyMarkdown: text("body_markdown").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

export const emailSequenceEnrollments = pgTable("email_sequence_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriberId: uuid("subscriber_id")
    .notNull()
    .references(() => emailSubscribers.id, { onDelete: "cascade" }),
  sequenceId: uuid("sequence_id")
    .notNull()
    .references(() => emailSequences.id, { onDelete: "cascade" }),
  currentStep: integer("current_step").notNull().default(0),
  nextSendAt: timestamp("next_send_at", { mode: "string" }).notNull(),
  completedAt: timestamp("completed_at", { mode: "string" }),
  enrolledAt: timestamp("enrolled_at", { mode: "string" }).defaultNow().notNull(),
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

// ─── Yoga CRM (single-center) ────────────────────────────
export const teachers = pgTable("teachers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  bio: text("bio"),
  payPerClassCents: integer("pay_per_class_cents").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

export const yogaClasses = pgTable("yoga_classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id").references(() => teachers.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at", { mode: "string" }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  dropInPriceCents: integer("drop_in_price_cents").notNull().default(0),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

// Yoga students — keyed by email.
export const students = pgTable("students", {
  email: varchar("email", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  passport: varchar("passport", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  nationality: varchar("nationality", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

export const studentMemberships = pgTable("student_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentEmail: varchar("student_email", { length: 255 })
    .notNull()
    .references(() => students.email, { onDelete: "cascade" }),
  type: membershipTypeEnum("type").notNull(),
  startsOn: timestamp("starts_on", { mode: "string" }).notNull(),
  endsOn: timestamp("ends_on", { mode: "string" }),
  classesRemaining: integer("classes_remaining"),
  pricePaidCents: integer("price_paid_cents").notNull().default(0),
  currency: varchar("currency", { length: 10 }).notNull().default("thb"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

export const classAttendance = pgTable("class_attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id")
    .notNull()
    .references(() => yogaClasses.id, { onDelete: "cascade" }),
  studentEmail: varchar("student_email", { length: 255 })
    .notNull()
    .references(() => students.email, { onDelete: "cascade" }),
  membershipId: uuid("membership_id").references(() => studentMemberships.id, {
    onDelete: "set null",
  }),
  checkedInAt: timestamp("checked_in_at", { mode: "string" }).defaultNow().notNull(),
})

export const teacherPayments = pgTable("teacher_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  classId: uuid("class_id").references(() => yogaClasses.id, {
    onDelete: "set null",
  }),
  periodStart: timestamp("period_start", { mode: "string" }).notNull(),
  periodEnd: timestamp("period_end", { mode: "string" }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("thb"),
  status: teacherPaymentStatusEnum("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

export const emailSends = pgTable("email_sends", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriberId: uuid("subscriber_id")
    .notNull()
    .references(() => emailSubscribers.id, { onDelete: "cascade" }),
  sequenceStepId: uuid("sequence_step_id").references(() => emailSequenceSteps.id, {
    onDelete: "set null",
  }),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: emailSendStatusEnum("status").notNull().default("queued"),
  resendId: varchar("resend_id", { length: 255 }),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})
