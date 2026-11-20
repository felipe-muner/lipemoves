"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { HIPS_COOKIE, hipsCookieOptions, tokenForCode } from "@/lib/hips-access"

export async function unlockHips(formData: FormData) {
  const token = tokenForCode(String(formData.get("code") ?? ""))
  if (!token) redirect("/hips/program?error=1")

  const jar = await cookies()
  jar.set(HIPS_COOKIE, token, hipsCookieOptions)
  redirect("/hips/program")
}
