import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { emailSequences, emailSequenceSteps } from "@/lib/db/schema"

const SEQUENCE_SLUG = "welcome"

const steps: Array<{
  subject: string
  preheader: string
  delayHours: number
  bodyMarkdown: string
}> = [
  {
    subject: "Seu Guia de Fundamentos chegou",
    preheader: "Comece por aqui — é o ponto zero de todo o trabalho.",
    delayHours: 0,
    bodyMarkdown: `Oi, aqui é o Lipe.

Você acabou de entrar na minha lista. Isso significa que, nos próximos dias, vou te mandar o que eu genuinamente acredito que vai mudar como você se move.

**Seu Guia de Fundamentos está aqui:** comece com 5 movimentos base que destravam quadril, ombro e coluna em menos de 10 minutos por dia.

Se você já sabe que quer mais do que um PDF — treino real, progressões, acompanhamento — me responde esse email. Eu leio todas as respostas.

Até amanhã,
Lipe`,
  },
  {
    subject: "Treinar mais forte não é a resposta",
    preheader: "Amanhã eu te dou um teste simples. 5 minutos. Sem equipamento.",
    delayHours: 24,
    bodyMarkdown: `A maioria das pessoas que me procuram já treina. Algumas treinam muito.

E ainda assim, travam.

Porque força em cima de um padrão de movimento ruim é só força em cima de um padrão de movimento ruim. Você fica mais forte no lugar errado.

**Amanhã vou te mandar um teste de 5 minutos.** Sem equipamento. Ele revela exatamente onde seu corpo está te enganando.

Lipe`,
  },
  {
    subject: "Tente esse teste de 5 minutos (revela tudo)",
    preheader: "Me responde: qual movimento foi mais difícil?",
    delayHours: 24,
    bodyMarkdown: `O teste:

1. Agachamento profundo, calcanhares no chão — 60 segundos
2. Ponte de ombro (shoulder bridge) — 30 segundos
3. Cobra com perna elevada — 20 segundos cada lado
4. Pigeon — 30 segundos cada lado
5. Respiração 4-7-8 — 1 minuto

**Me responde e me conta:** qual foi o mais duro? Onde você sentiu a maior restrição?

Eu leio todas as respostas. É assim que eu mapeio onde a maioria trava.

Lipe`,
  },
  {
    subject: "Por que mobilidade funciona quando tudo mais falha",
    preheader: "Não é alongamento. Não é yoga de revista. É outra coisa.",
    delayHours: 24,
    bodyMarkdown: `Mobilidade não é alongamento.

Alongamento alonga o tecido. Mobilidade ensina o sistema nervoso a confiar em uma amplitude nova. Por isso ela dura.

Se você já fez alongamento por meses e continua travado — não é que você não alongou o suficiente. É que seu sistema nunca foi convidado a usar aquela amplitude sob controle.

Amanhã: como encaixar isso na agenda mais louca.

Lipe`,
  },
  {
    subject: "Como isso cabe na agenda mais louca",
    preheader: "20 minutos. Filmei a sessão completa — você só dá play.",
    delayHours: 24,
    bodyMarkdown: `"Lipe, não tenho tempo."

Eu escuto isso toda semana. E entendo.

Por isso construí sessões de 20 minutos que cabem entre reunião e jantar. Filmei uma completa — você só dá play e segue.

Sem filosofia, sem música de elevador. Só o trabalho.

P.S. Se você já sabe que quer mais do que vídeos avulsos — programa estruturado, progressões, acompanhamento — responde esse email. Eu trabalho 1-a-1 com um grupo pequeno.

Lipe`,
  },
  {
    subject: "A cirurgia que não funcionou",
    preheader: "Se você já tentou tudo e nada resolveu — lê isso.",
    delayHours: 24,
    bodyMarkdown: `Ano passado, um aluno meu me procurou depois de 2 cirurgias de ombro.

Fisioterapia pós. Mais fisio. Mais fisio. Dor voltando.

O problema não era o ombro. Era como a escápula, o core e a respiração conversavam — ou não conversavam — com o ombro.

Em 8 semanas ele estava fazendo parada de mão pela primeira vez na vida.

Não conto isso pra vender milagre. Conto porque a maioria dos "problemas" que a gente carrega são sintomas, não causas.

Lipe`,
  },
  {
    subject: "O que a maioria ainda faz errado (e nem sabe)",
    preheader: "É um erro invisível. Até você ver.",
    delayHours: 24,
    bodyMarkdown: `O erro:

Treinar força e flexibilidade como coisas separadas.

Você faz agachamento pesado segunda, yoga quarta, treino de core sexta. Três silos. Três sistemas que nunca se falam.

O corpo não funciona assim. Ele não sabe o que é "dia de força" e "dia de mobilidade". Ele só sabe padrões de movimento.

Quando você integra — força dentro da amplitude, respiração dentro da força, mobilidade dentro do padrão — tudo muda.

Lipe`,
  },
  {
    subject: "Você está carregando um sistema quebrado",
    preheader: "E provavelmente nunca foi te ensinado o contrário.",
    delayHours: 24,
    bodyMarkdown: `Se você chegou na vida adulta sem ninguém te ensinar a respirar, agachar e levantar peso direito — boas-vindas ao clube.

A escola não ensina. A academia assume que você já sabe. E aí você passa 20 anos compensando.

A boa notícia: o corpo é absurdamente adaptável. Semanas, não anos, pra começar a destravar.

Amanhã: os 6 movimentos que são praticamente tudo que você precisa.

Lipe`,
  },
  {
    subject: "Domine esses 6 movimentos (é tudo que você precisa)",
    preheader: "Se você só fizer isso, já está à frente de 95% das pessoas.",
    delayHours: 24,
    bodyMarkdown: `Os 6:

1. **Agachamento profundo** — quadril, tornozelo, coluna
2. **Ponte** — extensão de quadril, ativação de glúteo, coluna torácica
3. **Cobra com rotação** — coluna, ombro, respiração
4. **Pigeon** — rotadores externos de quadril
5. **Parada de mão na parede** — ombro, core, consciência
6. **Respiração diafragmática** — a base de tudo

Faz esses 6 por 20 minutos, 4x na semana, por 60 dias. Depois me conta como você tá.

Lipe`,
  },
  {
    subject: "O que acontece quando realmente clica",
    preheader: "Não é o corpo que muda primeiro. É outra coisa.",
    delayHours: 24,
    bodyMarkdown: `Quando clica, não é o corpo que muda primeiro.

É a forma como você habita o corpo.

Você começa a perceber a mandíbula travada às 3 da tarde. A respiração presa no meio do peito. O ombro subindo quando você lê um email estressante.

Aí você respira. Relaxa. Move. E o corpo responde — imediato.

É isso que a prática entrega. Antes dos músculos, antes da flexibilidade — ela entrega percepção.

O resto vem junto.

Lipe`,
  },
  {
    subject: "Última coisa — vamos conversar?",
    preheader: "Se você quer coaching real, me responde.",
    delayHours: 24,
    bodyMarkdown: `Essa é a última mensagem dessa sequência.

Se ao longo desses dias algo ressoou — qualquer coisa — e você quer ir mais fundo do que vídeos avulsos, aqui está o que eu ofereço:

**Plano mensal ou anual do Lipe Moves:** acesso a toda a biblioteca — yoga, mobilidade, acrobacia, respiração. Novas aulas toda semana.

[Conhecer os planos →](https://lipemoves.com/pricing)

Se você quer coaching 1-a-1 — responde esse email. Trabalho com um grupo pequeno por vez.

Independente do que você escolher: obrigado por estar aqui. Continue se movendo.

Lipe`,
  },
]

async function main() {
  const [existing] = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.slug, SEQUENCE_SLUG))
    .limit(1)

  let sequenceId: string

  if (existing) {
    sequenceId = existing.id
    await db
      .delete(emailSequenceSteps)
      .where(eq(emailSequenceSteps.sequenceId, sequenceId))
    console.log(`Cleared existing steps for sequence "${SEQUENCE_SLUG}"`)
  } else {
    const [created] = await db
      .insert(emailSequences)
      .values({
        slug: SEQUENCE_SLUG,
        name: "Welcome Sequence",
        description: "11-email onboarding sequence — Lipe Moves",
      })
      .returning({ id: emailSequences.id })
    sequenceId = created.id
    console.log(`Created sequence "${SEQUENCE_SLUG}"`)
  }

  for (const [index, step] of steps.entries()) {
    await db.insert(emailSequenceSteps).values({
      sequenceId,
      stepOrder: index,
      delayHours: step.delayHours,
      subject: step.subject,
      preheader: step.preheader,
      bodyMarkdown: step.bodyMarkdown,
    })
  }

  console.log(`Seeded ${steps.length} steps`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
