import Header from "@/components/Header"

export default async function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <section className="px-6 py-24">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="font-heading text-4xl md:text-5xl">Thank you!</h1>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Your purchase is confirmed. In a moment you&apos;ll receive an email with the
            download link for your guide.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Didn&apos;t arrive within 5 minutes? Check your spam folder or reply to that
            email to ask for a resend.
          </p>
        </div>
      </section>
    </main>
  )
}
