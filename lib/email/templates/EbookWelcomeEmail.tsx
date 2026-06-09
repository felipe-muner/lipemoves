import { Button, Heading, Section, Text } from "@react-email/components"
import * as React from "react"
import { BaseEmail } from "./BaseEmail"

interface Props {
  firstName?: string | null
  ebookTitle: string
  langLabel: string
  downloadUrl: string
  unsubscribeUrl: string
}

export function EbookWelcomeEmail({
  firstName,
  ebookTitle,
  langLabel,
  downloadUrl,
  unsubscribeUrl,
}: Props) {
  const greeting = firstName ? `Hey ${firstName},` : "Hey,"
  return (
    <BaseEmail
      preheader={`Your copy of ${ebookTitle} (${langLabel}) is ready.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={{ fontSize: "24px", margin: "0 0 16px" }}>
        Your copy of {ebookTitle}
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{greeting}</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Thanks for grabbing the {langLabel} edition. Here it is — keep it on
        your phone, read it once, apply it for years.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button
          href={downloadUrl}
          style={{
            background: "#39FF14",
            color: "#0a0a0a",
            padding: "14px 24px",
            borderRadius: "9999px",
            fontSize: "15px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Download {ebookTitle}
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "22px", color: "#555" }}>
        I&apos;ll write once a week — short notes on movement, breathing, and
        eating. Nothing salesy. If it stops being useful, the unsubscribe link
        is at the bottom of every email.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "22px" }}>
        Move better,
        <br />
        Felipe
      </Text>
    </BaseEmail>
  )
}
