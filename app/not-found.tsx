import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="font-heading text-3xl">Página não encontrada</h2>
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground underline">
        Voltar ao início
      </Link>
    </div>
  )
}
