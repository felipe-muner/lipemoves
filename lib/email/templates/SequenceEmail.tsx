import { Markdown } from "@react-email/components"
import * as React from "react"
import { BaseEmail } from "./BaseEmail"

interface SequenceEmailProps {
  preheader?: string
  bodyMarkdown: string
  unsubscribeUrl: string
}

export function SequenceEmail({
  preheader,
  bodyMarkdown,
  unsubscribeUrl,
}: SequenceEmailProps) {
  return (
    <BaseEmail preheader={preheader} unsubscribeUrl={unsubscribeUrl}>
      <Markdown
        markdownCustomStyles={{
          p: { fontSize: "16px", lineHeight: "26px", color: "#111", margin: "0 0 16px" },
          h1: { fontSize: "24px", fontWeight: 700, margin: "0 0 16px" },
          h2: { fontSize: "20px", fontWeight: 700, margin: "24px 0 12px" },
          link: { color: "#111", textDecoration: "underline" },
        }}
      >
        {bodyMarkdown}
      </Markdown>
    </BaseEmail>
  )
}
