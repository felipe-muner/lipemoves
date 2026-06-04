import { Button, Heading, Text } from "@react-email/components"
import * as React from "react"
import { BaseEmail } from "./BaseEmail"

interface DeliveryEmailProps {
  productName: string
  downloadUrl: string
  expiresInHours: number
  unsubscribeUrl: string
}

export function DeliveryEmail({
  productName,
  downloadUrl,
  expiresInHours,
  unsubscribeUrl,
}: DeliveryEmailProps) {
  return (
    <BaseEmail
      preheader={`Your ${productName} download is ready`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={{ fontSize: "24px", margin: "0 0 16px" }}>
        Thank you for your purchase!
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "26px", margin: "0 0 16px" }}>
        Your <strong>{productName}</strong> is ready. Click the button below to
        download.
      </Text>
      <Button
        href={downloadUrl}
        style={{
          backgroundColor: "#111",
          color: "#fff",
          padding: "14px 24px",
          borderRadius: "8px",
          fontSize: "15px",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Download PDF
      </Button>
      <Text
        style={{
          fontSize: "14px",
          lineHeight: "22px",
          color: "#666",
          margin: "24px 0 0",
        }}
      >
        The link expires in {expiresInHours} hours. Save the PDF to your device as
        soon as you download it.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "22px", color: "#666", margin: "16px 0 0" }}>
        Questions? Just reply to this email.
        <br />— Lipe
      </Text>
    </BaseEmail>
  )
}
