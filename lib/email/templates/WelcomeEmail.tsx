import { Button, Heading, Text } from "@react-email/components"
import * as React from "react"
import { BaseEmail } from "./BaseEmail"

const LIME = "#39FF14"

interface WelcomeEmailProps {
  name?: string | null
  planLabel: string
  libraryUrl: string
  accountUrl: string
  unsubscribeUrl: string
}

export function WelcomeEmail({
  name,
  planLabel,
  libraryUrl,
  accountUrl,
  unsubscribeUrl,
}: WelcomeEmailProps) {
  const firstName = name?.split(" ")[0]

  return (
    <BaseEmail
      preheader="Your membership is active — the full library is open."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading as="h1" style={{ fontSize: "24px", margin: "0 0 16px" }}>
        Welcome to the crew{firstName ? `, ${firstName}` : ""} 🤸
      </Heading>
      <Text style={{ fontSize: "15px", lineHeight: "24px", margin: "0 0 12px" }}>
        Your <strong>{planLabel}</strong> membership is active. The full
        library of mobility &amp; kettlebell flows is now open — practice at
        your own pace, as often as you want.
      </Text>
      <Text style={{ fontSize: "15px", lineHeight: "24px", margin: "0 0 24px" }}>
        Start with Flow 01 today. Ten focused minutes beats an hour of
        scrolling.
      </Text>
      <Button
        href={libraryUrl}
        style={{
          backgroundColor: LIME,
          color: "#000",
          fontWeight: 700,
          fontSize: "15px",
          padding: "12px 28px",
          borderRadius: "999px",
        }}
      >
        Open the library
      </Button>
      <Text
        style={{
          fontSize: "13px",
          lineHeight: "20px",
          color: "#666",
          margin: "24px 0 0",
        }}
      >
        Billing, plan changes or cancellation: manage everything anytime from{" "}
        <a href={accountUrl} style={{ color: "#111" }}>
          your account
        </a>
        . Questions? Just reply to this email.
      </Text>
    </BaseEmail>
  )
}
