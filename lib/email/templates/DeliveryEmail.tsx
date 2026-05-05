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
      preheader={`Seu download de ${productName} está pronto`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={{ fontSize: "24px", margin: "0 0 16px" }}>
        Obrigado pela compra!
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "26px", margin: "0 0 16px" }}>
        Seu <strong>{productName}</strong> está pronto. Clique no botão abaixo para
        baixar.
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
        Baixar PDF
      </Button>
      <Text
        style={{
          fontSize: "14px",
          lineHeight: "22px",
          color: "#666",
          margin: "24px 0 0",
        }}
      >
        O link expira em {expiresInHours} horas. Salve o PDF no seu dispositivo assim
        que baixar.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "22px", color: "#666", margin: "16px 0 0" }}>
        Dúvidas? Responde esse email.
        <br />— Lipe
      </Text>
    </BaseEmail>
  )
}
