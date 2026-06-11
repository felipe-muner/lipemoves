import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface BaseEmailProps {
  preheader?: string
  /** Omit for transactional emails (password reset, receipts) — hides the unsubscribe link. */
  unsubscribeUrl?: string
  children: React.ReactNode
}

// Brand tokens (kept inline — email clients strip <style> / classes).
const LIME = "#39FF14"
const INK = "#0a0a0a"

export function BaseEmail({ preheader, unsubscribeUrl, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body
        style={{
          backgroundColor: "#f4f4f5",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#111",
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 16px" }}>
          {/* Dark header band with wordmark */}
          <Section
            style={{
              backgroundColor: INK,
              borderRadius: "16px 16px 0 0",
              padding: "22px 28px",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "#ffffff",
              }}
            >
              Lipe <span style={{ color: LIME }}>Moves</span>
            </Text>
          </Section>

          {/* Body card */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0 0 16px 16px",
              padding: "32px 28px",
            }}
          >
            {children}
            <Hr style={{ borderColor: "#eee", margin: "32px 0 16px" }} />
            <Text style={{ fontSize: "12px", color: "#888", lineHeight: "18px" }}>
              Lipe Moves — Move better, breathe deeper.
              <br />
              Koh Phangan, Thailand
              {unsubscribeUrl ? (
                <>
                  <br />
                  <Link
                    href={unsubscribeUrl}
                    style={{ color: "#888", textDecoration: "underline" }}
                  >
                    Unsubscribe
                  </Link>
                </>
              ) : null}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
