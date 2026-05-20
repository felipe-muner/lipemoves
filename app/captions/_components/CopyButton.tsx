"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20 active:scale-95"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Copy
        </>
      )}
    </button>
  )
}
