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
  unsubscribeUrl: string
  children: React.ReactNode
}

export function BaseEmail({ preheader, unsubscribeUrl, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body
        style={{
          backgroundColor: "#ffffff",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#111",
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 24px" }}>
          <Section>{children}</Section>
          <Hr style={{ borderColor: "#eee", margin: "32px 0 16px" }} />
          <Text style={{ fontSize: "12px", color: "#888", lineHeight: "18px" }}>
            Lipe Moves — Mova-se melhor, respire mais fundo.
            <br />
            Koh Phangan, Tailândia
            <br />
            <Link href={unsubscribeUrl} style={{ color: "#888", textDecoration: "underline" }}>
              Cancelar inscrição
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
