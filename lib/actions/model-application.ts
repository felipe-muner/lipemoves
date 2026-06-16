"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { modelApplications } from "@/lib/db/schema"

export type ModelApplicationResult = { ok: true } | { ok: false; error: string }

const social = z.string().trim().max(255).optional()

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255),
    phone: z.string().trim().min(5, "Phone number is required").max(40),
    phoneCountry: z.string().trim().length(2).optional(),
    whatsapp: social,
    instagram: social,
    telegram: social,
    tiktok: social,
    youtube: social,
    facebook: social,
    email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
    notes: z.string().trim().max(2000).optional(),
    whyChooseUs: z.string().trim().max(4000).optional(),
  })
  .refine(
    (d) =>
      Boolean(
        d.whatsapp ||
          d.instagram ||
          d.telegram ||
          d.tiktok ||
          d.youtube ||
          d.facebook ||
          d.email
      ),
    { message: "Add at least one social or contact handle", path: ["instagram"] }
  )

export type ModelApplicationInput = z.infer<typeof schema>

// Strip a leading "@" so handles store consistently; keep empty as null.
function clean(v?: string): string | null {
  const t = (v ?? "").replace(/^@+/, "").trim()
  return t || null
}

export async function submitModelApplication(
  input: ModelApplicationInput
): Promise<ModelApplicationResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the form",
    }
  }

  const d = parsed.data

  try {
    await db.insert(modelApplications).values({
      name: d.name,
      phone: d.phone,
      phoneCountry: d.phoneCountry ?? null,
      whatsapp: clean(d.whatsapp),
      instagram: clean(d.instagram),
      telegram: clean(d.telegram),
      tiktok: clean(d.tiktok),
      youtube: clean(d.youtube),
      facebook: clean(d.facebook),
      email: d.email?.trim().toLowerCase() || null,
      notes: d.notes || null,
      whyChooseUs: d.whyChooseUs || null,
    })
    return { ok: true }
  } catch (err) {
    console.error("submitModelApplication failed", err)
    return { ok: false, error: "Something went wrong. Please try again." }
  }
}
