import Header from "@/components/Header"

export default async function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <section className="px-6 py-24">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="font-heading text-4xl md:text-5xl">Obrigado!</h1>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Sua compra foi confirmada. Em instantes você vai receber um email com o link
            de download do guia.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Não chegou em 5 minutos? Confere a caixa de spam ou responde esse email
            pedindo reenvio.
          </p>
        </div>
      </section>
    </main>
  )
}
