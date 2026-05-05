import Link from "next/link"
import Header from "@/components/Header"
import NewsletterForm from "@/components/NewsletterForm"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="font-heading text-5xl leading-tight md:text-7xl">
            Mova-se <span className="text-primary">Melhor.</span>
            <br />
            Respire <span className="text-primary">Mais Fundo.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            V&iacute;deos de yoga, mobilidade, acrobacia e respira&ccedil;&atilde;o para voc&ecirc; praticar no
            seu ritmo &mdash; onde e quando quiser.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Comece Agora
            </Link>
            <Link
              href="#about"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border px-8 text-sm font-medium transition-colors hover:bg-accent"
            >
              Saiba Mais
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl">Sobre</h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Nascido no Rio de Janeiro, descobri o yoga e o movimento como forma de reconectar
            corpo e mente. O que come&ccedil;ou como pr&aacute;tica pessoal virou miss&atilde;o: ajudar pessoas a se
            moverem melhor, com mais consci&ecirc;ncia e liberdade.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Aqui voc&ecirc; encontra aulas de yoga, mobilidade, acrobacia e respira&ccedil;&atilde;o &mdash; tudo
            gravado com cuidado para voc&ecirc; praticar no seu tempo.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-center text-3xl md:text-4xl">Categorias</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Yoga", desc: "Aulas completas de vinyasa, hatha e yin yoga" },
              { title: "Mobilidade", desc: "Rotinas para destravar articulações e ganhar amplitude" },
              { title: "Acrobacia", desc: "Progressões de parada de mão, floreios e equilíbrio" },
              { title: "Respiração", desc: "Protocolos de breathwork para energia e foco" },
            ].map((cat) => (
              <div
                key={cat.title}
                className="rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/30"
              >
                <h3 className="font-heading text-xl">{cat.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl">Planos</h2>
          <p className="mt-4 text-muted-foreground">
            Acesso ilimitado a todos os v&iacute;deos. Cancele quando quiser.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="font-heading text-2xl">Mensal</h3>
              <p className="mt-4 text-4xl font-bold">
                R$97<span className="text-base font-normal text-muted-foreground">/m&ecirc;s</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>Acesso a todos os v&iacute;deos</li>
                <li>Novas aulas toda semana</li>
                <li>Cancele quando quiser</li>
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Assinar Mensal
              </Link>
            </div>
            <div className="relative rounded-xl border-2 border-primary bg-card p-8">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                Melhor valor
              </span>
              <h3 className="font-heading text-2xl">Anual</h3>
              <p className="mt-4 text-4xl font-bold">
                R$970<span className="text-base font-normal text-muted-foreground">/ano</span>
              </p>
              <p className="mt-1 text-sm text-primary">Economia de R$194</p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>Tudo do plano mensal</li>
                <li>2 meses gr&aacute;tis</li>
                <li>Acesso priorit&aacute;rio</li>
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Assinar Anual
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl">
            Receba o Guia de Fundamentos
          </h2>
          <p className="mt-4 text-muted-foreground">
            5 movimentos base que destravam quadril, ombro e coluna em 10 minutos por dia.
            Gr&aacute;tis, direto no seu email.
          </p>
          <div className="mt-8">
            <NewsletterForm source="homepage" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-heading text-lg">Lipe Moves</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Mova-se melhor. Respire mais fundo. Viva plenamente.
          </p>
          <p className="mt-6 text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Lipe Moves. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  )
}
