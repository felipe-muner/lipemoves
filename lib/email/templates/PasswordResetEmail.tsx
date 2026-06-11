import { Button, Heading, Section, Text } from "@react-email/components"
import * as React from "react"
import { BaseEmail } from "./BaseEmail"

interface Props {
  firstName?: string | null
  resetUrl: string
}

export function PasswordResetEmail({ firstName, resetUrl }: Props) {
  const greeting = firstName ? `Hey ${firstName},` : "Hey,"
  return (
    <BaseEmail preheader="Reset your Lipe Moves password — link expires in 1 hour.">
      <Heading style={{ fontSize: "24px", margin: "0 0 16px" }}>
        Reset your password
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{greeting}</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Someone asked to reset the password for your Lipe Moves account. If
        that was you, tap the button below to choose a new one.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button
          href={resetUrl}
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
          Choose a new password
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "22px", color: "#555" }}>
        The link expires in 1 hour. If you didn&apos;t ask for this, you can
        safely ignore this email — your password stays the same.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "22px" }}>
        Move better,
        <br />
        Felipe
      </Text>
    </BaseEmail>
  )
}
