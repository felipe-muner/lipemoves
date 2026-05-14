import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  varchar,
  pgEnum,
  jsonb,
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

export const emailCampaignTemplateEnum = pgEnum("email_campaign_template", [
  "announcement",
  "class_reminder",
  "membership_expiring",
  "custom",
])

export const emailCampaignStatusEnum = pgEnum("email_campaign_status", [
  "draft",
  "sending",
  "sent",
  "failed",
])

export const emailRecipientStatusEnum = pgEnum("email_recipient_status", [
  "queued",
  "sent",
  "failed",
])

export const productBaseUnitEnum = pgEnum("product_base_unit", [
  "g",
  "ml",
  "piece",
])

export const productCategoryEnum = pgEnum("product_category", [
  "drink",
  "food",
  "supplement",
  "retail",
  "other",
])

export const stockMovementReasonEnum = pgEnum("stock_movement_reason", [
  "purchase",
  "sale",
  "adjustment",
  "opening",
  "waste",
])

export const restaurantTableStatusEnum = pgEnum("restaurant_table_status", [
  "open",
  "occupied",
  "cleaning",
  "closed",
])

export const saleStatusEnum = pgEnum("sale_status", [
  "open",
  "paid",
  "cancelled",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "transfer",
  "other",
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
export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 9 }).notNull().default("#fbbf24"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

/**
 * Employees — the unified "people who work here" entity.
 * Replaces the old single-purpose `teachers` table. An employee can
 * hold multiple roles (teacher, waiter, manager, ...) and belong to
 * multiple teams (kitchen, front-desk, ...).
 */
export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  passport: varchar("passport", { length: 100 }),
  bio: text("bio"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 9 }).notNull().default("#a78bfa"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 9 }).notNull().default("#38bdf8"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

export const employeeRoles = pgTable("employee_roles", {
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at", { mode: "string" }).defaultNow().notNull(),
})

export const employeeTeams = pgTable("employee_teams", {
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at", { mode: "string" }).defaultNow().notNull(),
})

export const yogaClasses = pgTable("yoga_classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").references(() => employees.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at", { mode: "string" }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  priceThb: integer("price_thb").notNull().default(0),
  teacherSharePercent: integer("teacher_share_percent").notNull().default(0),
  locationId: uuid("location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
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
  pricePaidThb: integer("price_paid_thb").notNull().default(0),
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

// ─── Email campaigns (one-shot broadcasts) ──────────────────
export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  template: emailCampaignTemplateEnum("template").notNull().default("custom"),
  subject: varchar("subject", { length: 255 }).notNull(),
  bodyText: text("body_text").notNull(),
  /** Snapshot of the filter used to resolve recipients (audience). */
  audience: jsonb("audience").notNull(),
  /** Human-readable summary, e.g. "All students (43)". */
  audienceSummary: varchar("audience_summary", { length: 255 }).notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  status: emailCampaignStatusEnum("status").notNull().default("draft"),
  sentAt: timestamp("sent_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

export const emailCampaignSends = pgTable("email_campaign_sends", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => emailCampaigns.id, { onDelete: "cascade" }),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  status: emailRecipientStatusEnum("status").notNull().default("queued"),
  resendId: varchar("resend_id", { length: 255 }),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

// ─── Products & stock ────────────────────────────────────────
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: varchar("sku", { length: 100 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: productCategoryEnum("category").notNull().default("other"),
  baseUnit: productBaseUnitEnum("base_unit").notNull().default("piece"),
  /** Stock kept in base-unit. e.g. 1 kg whey → stockQty=1000, baseUnit=g. */
  stockQty: integer("stock_qty").notNull().default(0),
  /** Amount consumed per sale unit. e.g. a 30g shake → servingSize=30. */
  servingSize: integer("serving_size").notNull().default(1),
  /** Price per sale unit (i.e. per serving), in whole THB. */
  priceThb: integer("price_thb").notNull().default(0),
  /** Optional cost per base-unit (THB×100 cents-style) — used later for COGS. */
  costThbCents: integer("cost_thb_cents"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  /** Signed integer in product.baseUnit (positive = add, negative = consume). */
  change: integer("change").notNull(),
  reason: stockMovementReasonEnum("reason").notNull(),
  refType: varchar("ref_type", { length: 30 }),
  refId: uuid("ref_id"),
  note: text("note"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})

// ─── Restaurant ──────────────────────────────────────────────
export const restaurantTables = pgTable("restaurant_tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  tableNumber: varchar("table_number", { length: 50 }).notNull(),
  room: varchar("room", { length: 100 }),
  seats: integer("seats"),
  status: restaurantTableStatusEnum("status").notNull().default("open"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  tableId: uuid("table_id").references(() => restaurantTables.id, {
    onDelete: "set null",
  }),
  /** The waiter / server. */
  employeeId: uuid("employee_id").references(() => employees.id, {
    onDelete: "set null",
  }),
  status: saleStatusEnum("status").notNull().default("open"),
  subtotalThb: integer("subtotal_thb").notNull().default(0),
  discountThb: integer("discount_thb").notNull().default(0),
  tipThb: integer("tip_thb").notNull().default(0),
  totalThb: integer("total_thb").notNull().default(0),
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentNote: varchar("payment_note", { length: 255 }),
  customerNote: text("customer_note"),
  openedAt: timestamp("opened_at", { mode: "string" }).defaultNow().notNull(),
  paidAt: timestamp("paid_at", { mode: "string" }),
  cancelledAt: timestamp("cancelled_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
})

export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  /** Snapshot of the product name at sale time (so historical sales survive renames). */
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceThb: integer("unit_price_thb").notNull().default(0),
  totalThb: integer("total_thb").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
})
