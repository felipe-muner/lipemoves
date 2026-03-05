import type { InferSelectModel, InferInsertModel } from "drizzle-orm"
import type {
  users,
  accounts,
  sessions,
  verificationTokens,
  subscriptions,
  categories,
  videos,
  watchProgress,
} from "@/lib/db/schema"

// ─── Select types (read from DB) ────────────────────────
export type User = InferSelectModel<typeof users>
export type Account = InferSelectModel<typeof accounts>
export type Session = InferSelectModel<typeof sessions>
export type VerificationToken = InferSelectModel<typeof verificationTokens>
export type Subscription = InferSelectModel<typeof subscriptions>
export type Category = InferSelectModel<typeof categories>
export type Video = InferSelectModel<typeof videos>
export type WatchProgress = InferSelectModel<typeof watchProgress>

// ─── Insert types (write to DB) ─────────────────────────
export type NewUser = InferInsertModel<typeof users>
export type NewAccount = InferInsertModel<typeof accounts>
export type NewSession = InferInsertModel<typeof sessions>
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>
export type NewSubscription = InferInsertModel<typeof subscriptions>
export type NewCategory = InferInsertModel<typeof categories>
export type NewVideo = InferInsertModel<typeof videos>
export type NewWatchProgress = InferInsertModel<typeof watchProgress>
