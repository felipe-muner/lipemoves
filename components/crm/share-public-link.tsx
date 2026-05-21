"use client"

import * as React from "react"
import { toast } from "sonner"
import { Share2, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SharePublicLink({ path }: { path: string }) {
  const [copied, setCopied] = React.useState(false)

  function copy() {
    const url =
      typeof window !== "undefined" ? window.location.origin + path : path
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true)
        toast.success("Public link copied")
        setTimeout(() => setCopied(false), 2000)
      },
      () => toast.error("Could not copy"),
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? (
          <Check className="mr-2 h-4 w-4" />
        ) : (
          <Share2 className="mr-2 h-4 w-4" />
        )}
        Share
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <a href={path} target="_blank" rel="noopener noreferrer" title="Open public page">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}
