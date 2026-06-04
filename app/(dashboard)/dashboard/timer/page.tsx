import type { Metadata } from "next"

import { PageHeader } from "@/components/crm/page-header"

import { TimerClient } from "./_components/TimerClient"

export const metadata: Metadata = {
  title: "Timer — Lipe Moves",
  description: "EMOM interval timer with a beep on every minute",
  robots: { index: false, follow: false },
}

export default function TimerPage() {
  return (
    <main className="space-y-8">
      <PageHeader
        title="Interval Timer"
        subtitle={
          <>
            A countdown that{" "}
            <span className="text-emerald-500">beeps every minute</span> — set
            the minutes, hit start, work the top of each minute and rest until
            the next beep.
          </>
        }
      />
      <TimerClient />
    </main>
  )
}
