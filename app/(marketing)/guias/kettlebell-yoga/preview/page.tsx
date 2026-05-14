import "./print.css"
import PrintToolbar from "./PrintToolbar"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Movimento Integrado — Kettlebell + Yoga | Lipe Moves",
}

function PhotoPlaceholder({
  caption,
  ratio = "landscape",
  src,
  alt,
}: {
  caption: string
  ratio?: "landscape" | "portrait" | "square"
  src?: string
  alt?: string
}) {
  const heightClass =
    ratio === "portrait" ? "pdf-photo-portrait" : ratio === "square" ? "pdf-photo-square" : "pdf-photo-landscape"

  if (src) {
    return (
      <figure className={`pdf-photo-figure ${heightClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? caption} className="pdf-photo-img" />
      </figure>
    )
  }

  return (
    <div className={`pdf-photo ${heightClass}`}>
      <span>{caption}</span>
    </div>
  )
}

const IMG = {
  cover: "https://images.unsplash.com/photo-1570440828762-ab7a993dbde8?w=1400&q=80",
  assessmentSquat: "https://images.unsplash.com/photo-1599447332412-6bc6830c815a?w=1200&q=80",
  hingeTest: "https://images.unsplash.com/photo-1593811167565-4672e6c8ce4c?w=1200&q=80",
  breathing: "https://images.unsplash.com/photo-1532798442725-41036acc7489?w=1200&q=80",
  catCow: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80",
  kbGrip: "https://images.unsplash.com/photo-1632077804406-188472f1a810?w=1200&q=80",
  hingeVsSquat: "https://images.unsplash.com/photo-1644085159448-1659fd88a217?w=1200&q=80",
  deadlift: "https://images.unsplash.com/photo-1686791789070-90949cfec4b6?w=1200&q=80",
  swing: "https://images.unsplash.com/photo-1765302886933-34d10c152af3?w=1200&q=80",
  gobletSquat: "https://images.unsplash.com/photo-1653647358769-c0465db60293?w=1200&q=80",
  clean: "https://images.unsplash.com/photo-1710814824560-943273e8577e?w=1200&q=80",
  press: "https://images.unsplash.com/photo-1632077804406-188472f1a810?w=1200&q=80",
  tgu: "https://images.unsplash.com/photo-1570440828762-ab7a993dbde8?w=1200&q=80",
  flowA: "https://images.unsplash.com/photo-1599447292180-45fd84092ef0?w=1200&q=80",
  flowB: "https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=1200&q=80",
  downDog: "https://images.unsplash.com/photo-1632167759227-80bdfe5bfbf2?w=1200&q=80",
  meditation: "https://images.unsplash.com/photo-1577344718665-3e7c0c1ecf6b?w=1200&q=80",
  closing: "https://images.unsplash.com/photo-1570276095143-a627b6514b1d?w=1200&q=80",
}

export default function GuidePreviewPage() {
  return (
    <div className="pdf-root">
      <PrintToolbar />

      {/* ─── PAGE 1: COVER ──────────────────────────────────── */}
      <section className="pdf-page pdf-cover">
        <div className="pdf-cover-eyebrow">Lipe Moves</div>
        <PhotoPlaceholder
          src={IMG.cover}
          alt="Kettlebell — Lipe Moves"
          caption="[FOTO DE CAPA: substituir por Lipe]"
          ratio="portrait"
        />
        <div className="pdf-cover-title">
          <h1>
            Movimento
            <br />
            Integrado
          </h1>
          <p className="pdf-cover-subtitle">
            Kettlebell + Yoga para Força Real, Corpo Destravado e Respiração que Sustenta.
          </p>
          <p className="pdf-cover-author">
            Um programa de 30 dias
            <br />
            por <strong>Lipe</strong>
          </p>
        </div>
      </section>

      {/* ─── PAGE 2: CARTA ────────────────────────────────── */}
      <section className="pdf-page">
        <h2>Carta</h2>
        <p className="pdf-lede">Oi. Aqui é o Lipe.</p>
        <p>
          Esse guia existe porque eu passei os últimos dez anos tentando responder uma pergunta: por que tanta gente
          treina duro e ainda se sente travada? Por que ombro dói, lombar reclama, quadril não abre — mesmo em gente
          forte?
        </p>
        <p>
          A resposta que eu fui encontrando não está em treinar mais. Está em treinar <em>integrado</em>. Força
          (kettlebell) e amplitude controlada (yoga) não são coisas separadas. São o mesmo trabalho visto de dois
          ângulos. Quando você junta, o corpo para de compensar e começa a performar.
        </p>
        <p>
          Esse guia é o que eu dou para quem chega novo. Não é filosofia. Não é teoria. São 30 dias de trabalho real,
          do jeito que eu faço, com o por-quê por trás de cada escolha.
        </p>
        <p>
          Se você fizer o programa inteiro, no ritmo proposto, eu te garanto: você não vai só ficar mais forte. Você
          vai habitar seu corpo de um jeito novo.
        </p>
        <p className="pdf-sign">— Lipe</p>
      </section>

      {/* ─── PAGE 3: POR QUE KETTLEBELL + YOGA ──────────────── */}
      <section className="pdf-page">
        <h2>Por que kettlebell + yoga?</h2>
        <p>
          Kettlebell ensina o corpo a produzir força dentro de padrões balísticos. Quadril, core, ombro — tudo
          trabalhando junto contra gravidade e momentum. Poucas ferramentas entregam tanto por tão pouco tempo.
        </p>
        <p>
          Yoga ensina o sistema nervoso a confiar em amplitudes novas sob controle. Não é flexibilidade passiva. É
          mobilidade ativa — a capacidade de chegar lá, ficar lá, sair de lá com intenção.
        </p>
        <h3>Por que os dois juntos</h3>
        <ul>
          <li>
            <strong>Kettlebell sem mobilidade</strong> constrói força em cima de padrões ruins. Você fica forte no
            lugar errado.
          </li>
          <li>
            <strong>Yoga sem força</strong> vira alongamento bonito que não sustenta carga. Você fica flexível mas
            vulnerável.
          </li>
          <li>
            <strong>Juntos</strong>, um exige o outro. A amplitude que o yoga abre, o kettlebell precisa. A força que
            o kettlebell constrói, o yoga exige estabilizar.
          </li>
        </ul>
        <div className="pdf-callout">
          <strong>A tese desse guia:</strong> amplitude sem força é ilusão. Força sem amplitude é futuro de lesão. O
          trabalho é sempre os dois.
        </div>
      </section>

      {/* ─── PAGE 4: COMO USAR ESTE GUIA ──────────────────── */}
      <section className="pdf-page">
        <h2>Como usar este guia</h2>
        <h3>Duração</h3>
        <p>
          30 dias. 4 semanas. 4 treinos por semana: 2 de kettlebell, 2 de yoga/mobilidade. Domingo é descanso ativo —
          caminhada, respiração, nada mais.
        </p>
        <h3>Equipamento</h3>
        <ul>
          <li>
            <strong>Um kettlebell.</strong> Homens: comece com 16kg. Mulheres: 8-12kg. Se tiver dois pesos, melhor —
            um mais leve para ensinar, um mais pesado para consolidar.
          </li>
          <li>
            <strong>Um tapete de yoga.</strong> Qualquer um serve.
          </li>
          <li>
            <strong>Espaço.</strong> 2x2 metros bastam.
          </li>
          <li>
            <strong>Um cronômetro no celular.</strong>
          </li>
        </ul>
        <h3>Princípios que valem mais que qualquer plano</h3>
        <ol>
          <li>
            <strong>Respiração manda.</strong> Se você prendeu a respiração, o movimento já é compensatório. Para,
            respira, volta.
          </li>
          <li>
            <strong>Qualidade antes de quantidade.</strong> 5 swings perfeitos &gt; 20 swings ruins.
          </li>
          <li>
            <strong>Dor aguda é sinal de parar.</strong> Desconforto de esforço é bem-vindo. Dor articular, não.
          </li>
          <li>
            <strong>Consistência vence intensidade.</strong> 30 minutos 4x na semana durante 30 dias muda seu corpo.
          </li>
        </ol>
      </section>

      {/* ─── PAGE 5: AVALIAÇÃO INICIAL ──────────────────────── */}
      <section className="pdf-page">
        <h2>Antes de começar: avaliação de 5 minutos</h2>
        <p>Faz esse teste agora. Anote como você se sente em cada item. Repita no dia 30 e compara.</p>

        <div className="pdf-assessment">
          <h3>1. Agachamento profundo (60s)</h3>
          <p>
            Pés na largura do quadril, desce até os calcanhares encostarem no chão. Fica 60 segundos. Calcanhares
            saem do chão? Joelhos caem para dentro? Coluna arredonda?
          </p>
          <PhotoPlaceholder src={IMG.assessmentSquat} caption="[FOTO: agachamento profundo]" />

          <h3>2. Hinge test — touch toes (30s)</h3>
          <p>De pé, pernas retas, tenta encostar os dedos no chão. Onde você sente? Lombar? Posterior?</p>
          <PhotoPlaceholder src={IMG.hingeTest} caption="[FOTO: hinge teste]" />

          <h3>3. Ponte de ombro (30s)</h3>
          <p>Deitado de costas, joelhos dobrados, sobe o quadril. Sente glúteo ou lombar?</p>

          <h3>4. Pigeon (30s cada lado)</h3>
          <p>Clássica pose de pombo. Qual lado está mais travado?</p>

          <h3>5. Respiração diafragmática (1 min)</h3>
          <p>Mão no peito, mão na barriga. Inspira. O que sobe primeiro?</p>
        </div>
      </section>

      {/* ─── PAGE 6-7: FUNDAMENTOS — RESPIRAÇÃO ─────────────── */}
      <section className="pdf-page">
        <h2>Fundamento #1: Respiração</h2>
        <p>
          Toda progressão nesse guia assume que você respira certo. Se não respira, nada abaixo funciona. Essa é a
          primeira e a mais ignorada das habilidades.
        </p>
        <h3>Respiração diafragmática</h3>
        <p>
          Deitado, mão no peito, mão na barriga. Inspira pelo nariz fazendo a barriga subir — não o peito. Expira
          longa pela boca, barriga desce. 5 minutos, todo dia.
        </p>
        <PhotoPlaceholder src={IMG.breathing} caption="[FOTO: respiração]" />

        <h3>Box breathing (caixa)</h3>
        <p>4 segundos inspira, 4 segura, 4 expira, 4 segura. Ciclo de 4. Use antes de treinos pesados para centrar.</p>

        <h3>4-7-8 para recuperação</h3>
        <p>
          Inspira 4 segundos, segura 7, expira 8. Ativa o parassimpático. Use depois do treino ou antes de dormir.
        </p>

        <div className="pdf-callout">
          <strong>Regra simples:</strong> no agachamento, no swing, em qualquer movimento — se você parou de respirar,
          o movimento já é ruim. Mantenha o fluxo.
        </div>
      </section>

      {/* ─── PAGE 7: MOBILITY WARMUP ────────────────────────── */}
      <section className="pdf-page">
        <h2>Fundamento #2: Warmup de mobilidade (8 min)</h2>
        <p>Faz isso antes de todo treino. Inclusive os de yoga. 8 minutos. Não pula.</p>

        <ol className="pdf-steps">
          <li>
            <strong>Cat-cow</strong> — 10 ciclos. Coluna acorda.
            <PhotoPlaceholder src={IMG.catCow} caption="[FOTO: cat-cow]" />
          </li>
          <li>
            <strong>World&apos;s greatest stretch</strong> — 5 cada lado. Quadril, torácica, ombro em um só movimento.
          </li>
          <li>
            <strong>90/90 hip switch</strong> — 10 trocas. Rotação interna e externa de quadril.
          </li>
          <li>
            <strong>Cobra com rotação</strong> — 5 cada lado. Torácica.
          </li>
          <li>
            <strong>Deep squat hold</strong> — 60 segundos. Habitua o corpo ao agachamento profundo.
          </li>
          <li>
            <strong>Ombro halo</strong> — 5 cada direção (com kettlebell leve, opcional).
          </li>
        </ol>
      </section>

      {/* ─── PAGE 8: KETTLEBELL 101 ──────────────────────────── */}
      <section className="pdf-page">
        <h2>Kettlebell 101</h2>
        <h3>Pegada</h3>
        <p>
          O kettlebell senta na diagonal da mão, do dedão até o cotovelo do mindinho. Não na palma. Polegar
          relaxado. Pulso neutro — sem dobrar para cima ou para baixo.
        </p>
        <PhotoPlaceholder src={IMG.kbGrip} caption="[FOTO: pegada do kettlebell]" />

        <h3>Stance</h3>
        <p>
          Pés na largura dos ombros, ligeiramente virados para fora. Peso distribuído — um pouco mais no meio do pé
          que no calcanhar.
        </p>

        <h3>Hinge (dobradiça de quadril)</h3>
        <p>
          A habilidade mais importante. Empurra o quadril para trás, joelhos dobram pouco, coluna neutra, peso nos
          calcanhares. É <em>diferente</em> do agachamento. No hinge o movimento é horizontal; no agachamento,
          vertical.
        </p>
        <PhotoPlaceholder src={IMG.hingeVsSquat} caption="[FOTO: hinge vs agachamento]" />

        <h3>Respiração</h3>
        <p>
          Na maior parte dos exercícios: inspira na descida, expira forte na subida. Expiração curta e percussiva,
          como &quot;tss&quot; — isso ativa o core.
        </p>

        <h3>Regras de ouro</h3>
        <ul>
          <li>Nunca curva a lombar.</li>
          <li>Nunca levanta um peso que você não consegue colocar no chão com controle.</li>
          <li>Se perdeu a forma, para. Respira. Reinicia.</li>
        </ul>
      </section>

      {/* ─── PAGE 9-11: 6 MOVIMENTOS DE KETTLEBELL ────────────── */}
      <section className="pdf-page">
        <h2>Os 6 movimentos de kettlebell</h2>

        <div className="pdf-movement">
          <h3>1. Deadlift de kettlebell</h3>
          <p>
            <strong>Por quê:</strong> ensina o hinge. Base de tudo.
          </p>
          <p>
            <strong>Como:</strong> kettlebell entre os pés. Empurra quadril para trás, dobra minimamente os joelhos,
            pega com as duas mãos, expira forte subindo. Core apertado, ombros atrás.
          </p>
          <p>
            <strong>Erros comuns:</strong> dobrar muito o joelho (vira agachamento), lombar arredondada, subir com a
            lombar em vez do glúteo.
          </p>
          <PhotoPlaceholder src={IMG.deadlift} caption="[FOTO: deadlift]" />
        </div>

        <div className="pdf-movement">
          <h3>2. Kettlebell swing (two-handed)</h3>
          <p>
            <strong>Por quê:</strong> o movimento-rei. Quadril, core, cardio, poder — tudo.
          </p>
          <p>
            <strong>Como:</strong> do deadlift, você &quot;hike&quot; o kettlebell para trás entre as pernas (como um
            passe de rugby). Explode o quadril para frente, o kettlebell flutua até a altura do peito. <em>Não</em>{" "}
            levanta com o braço — é puro drive de quadril.
          </p>
          <p>
            <strong>Erros comuns:</strong> agachar em vez de fazer hinge, usar braço para subir o peso, hiperextensão
            lombar no topo.
          </p>
          <PhotoPlaceholder src={IMG.swing} caption="[FOTO: swing]" />
        </div>
      </section>

      <section className="pdf-page">
        <div className="pdf-movement">
          <h3>3. Goblet squat</h3>
          <p>
            <strong>Por quê:</strong> ensina o padrão de agachamento com carga frontal. Segurando o peso na frente,
            seu corpo tem que encontrar a posição correta.
          </p>
          <p>
            <strong>Como:</strong> segura o kettlebell pelos &quot;chifres&quot; na altura do peito, cotovelos para
            baixo. Agacha profundo, calcanhares no chão, joelhos acompanham os pés, coluna neutra.
          </p>
          <p>
            <strong>Erros comuns:</strong> calcanhar sair do chão, joelho cair para dentro, arqueado para trás.
          </p>
          <PhotoPlaceholder src={IMG.gobletSquat} caption="[FOTO: goblet squat]" />
        </div>

        <div className="pdf-movement">
          <h3>4. Clean</h3>
          <p>
            <strong>Por quê:</strong> transiciona o peso do chão para a posição &quot;rack&quot; (no ombro). É a ponte
            entre swing e press.
          </p>
          <p>
            <strong>Como:</strong> um swing de uma mão que termina com o kettlebell pousando no antebraço, junto ao
            peito. O peso &quot;estaciona&quot; — não bate, não sacode.
          </p>
          <p>
            <strong>Erros comuns:</strong> kettlebell bate no antebraço (trajetória errada), cotovelo alto demais,
            ombro subindo.
          </p>
          <PhotoPlaceholder src={IMG.clean} caption="[FOTO: clean]" />
        </div>

        <div className="pdf-movement">
          <h3>5. Military press</h3>
          <p>
            <strong>Por quê:</strong> força de empurrar vertical. Ombro, core, estabilidade de toda a cadeia.
          </p>
          <p>
            <strong>Como:</strong> da posição rack, empurra o peso para cima em linha reta. Core apertado, glúteo
            apertado, não arqueia a lombar. Braço termina ao lado da orelha, ombro &quot;empacotado&quot;.
          </p>
          <p>
            <strong>Erros comuns:</strong> arquear a lombar para compensar ombro rígido, cotovelo desalinhado do
            pulso.
          </p>
          <PhotoPlaceholder src={IMG.press} caption="[FOTO: press]" />
        </div>
      </section>

      <section className="pdf-page">
        <div className="pdf-movement">
          <h3>6. Turkish get-up (TGU)</h3>
          <p>
            <strong>Por quê:</strong> o exercício mais completo do kettlebell. Do chão em pé e de volta, com peso
            acima da cabeça. Estabilidade de ombro, core, quadril, consciência corporal.
          </p>
          <p>
            <strong>Como:</strong> 7 passos. Deitado → cotovelo → mão → ponte → joelho passa por baixo → ajoelhado →
            em pé. E reverte. Peso <em>sempre</em> perpendicular ao chão.
          </p>
          <p>
            <strong>Erros comuns:</strong> braço não vertical, pular etapas, pressa. TGU é feito devagar. Sempre.
          </p>
          <PhotoPlaceholder src={IMG.tgu} caption="[FOTO: Turkish get-up]" />
        </div>

        <div className="pdf-callout">
          <strong>Regra:</strong> um TGU perfeito por lado, sem pressa, vale mais que dez apressados. Esse movimento
          não é para acumular repetições. É para construir consciência.
        </div>
      </section>

      {/* ─── PAGE 12-13: YOGA FLOWS ─────────────────────────── */}
      <section className="pdf-page">
        <h2>Flows de yoga</h2>

        <div className="pdf-flow">
          <h3>Flow A — Ativação matinal (15 min)</h3>
          <p>Para fazer cedo, antes de qualquer coisa. Acorda o corpo inteiro.</p>
          <ol>
            <li>Child&apos;s pose — 1 min</li>
            <li>Cat-cow — 10 ciclos</li>
            <li>Down dog — 1 min (pedala as pernas nos primeiros 30s)</li>
            <li>Sun salutation A — 3 rodadas</li>
            <li>Warrior II — 30s cada lado</li>
            <li>Triangle pose — 30s cada lado</li>
            <li>Squat + twist — 1 min</li>
            <li>Cobra — 5 respirações</li>
            <li>Child&apos;s pose — finaliza</li>
          </ol>
          <PhotoPlaceholder src={IMG.flowA} caption="[FOTO: Flow A]" />
        </div>
      </section>

      <section className="pdf-page">
        <div className="pdf-flow">
          <h3>Flow B — Descompressão noturna (20 min)</h3>
          <p>Para depois de treino, ou antes de dormir. Desliga o sistema nervoso.</p>
          <ol>
            <li>Legs up the wall — 3 min</li>
            <li>Pigeon — 2 min cada lado</li>
            <li>Seated forward fold — 2 min</li>
            <li>Butterfly — 2 min</li>
            <li>Happy baby — 1 min</li>
            <li>Supine spinal twist — 1 min cada lado</li>
            <li>Savasana com respiração 4-7-8 — 5 min</li>
          </ol>
          <PhotoPlaceholder src={IMG.flowB} caption="[FOTO: Flow B]" />
        </div>

        <h3>Quando usar cada flow</h3>
        <ul>
          <li>
            <strong>Dias de kettlebell:</strong> Flow A de manhã (opcional), Flow B depois do treino.
          </li>
          <li>
            <strong>Dias de yoga puro:</strong> Flow A + trabalho de mobilidade específico.
          </li>
          <li>
            <strong>Dia difícil:</strong> só Flow B. Basta.
          </li>
        </ul>
      </section>

      {/* ─── PAGE 14-15: PROGRAMA 30 DIAS ───────────────────── */}
      <section className="pdf-page">
        <h2>O programa de 30 dias</h2>
        <p>
          4 treinos por semana. Segunda e quinta são kettlebell. Terça e sexta são yoga/mobilidade. Quarta é off.
          Sábado é livre (caminhada, natação, trilha — movimento leve). Domingo, descanso completo.
        </p>

        <h3>Treino A — Kettlebell base (segunda)</h3>
        <ol>
          <li>Warmup (8 min)</li>
          <li>Deadlift — 5 × 8</li>
          <li>Goblet squat — 5 × 8</li>
          <li>Two-handed swing — 5 × 15</li>
          <li>Dead bug + plank combo — 3 × 30s</li>
          <li>Flow B (descompressão)</li>
        </ol>

        <h3>Treino B — Kettlebell desenvolvimento (quinta)</h3>
        <ol>
          <li>Warmup (8 min)</li>
          <li>Clean — 5 × 5 cada lado</li>
          <li>Press — 5 × 5 cada lado</li>
          <li>One-arm swing — 5 × 10 cada lado</li>
          <li>Turkish get-up — 3 × 1 cada lado (foco em forma)</li>
          <li>Flow B</li>
        </ol>
      </section>

      <section className="pdf-page">
        <h3>Treino C — Yoga força (terça)</h3>
        <ol>
          <li>Warmup (5 min)</li>
          <li>Sun salutation A — 5 rodadas</li>
          <li>Sun salutation B — 3 rodadas</li>
          <li>Standing series: Warrior I, II, III, Triangle, Half-moon</li>
          <li>Parada de mão na parede — 3 × 30s</li>
          <li>Chaturanga negativas — 3 × 5</li>
          <li>Closing: cobra, child&apos;s pose, savasana</li>
        </ol>

        <h3>Treino D — Yoga mobilidade (sexta)</h3>
        <ol>
          <li>Flow A completo</li>
          <li>Hip series: lizard, pigeon, half-split, frog — 2 min cada</li>
          <li>Spinal twists — 2 min cada lado</li>
          <li>Shoulder series: thread the needle, puppy pose — 2 min cada</li>
          <li>Yin: 3 poses escolhidas, 5 min cada</li>
          <li>Savasana guiada com 4-7-8</li>
        </ol>

        <h3>Progressão de carga</h3>
        <p>
          Semana 1-2: aprende o padrão, forma perfeita, carga leve. Semana 3: aumenta 2kg no kettlebell nos
          movimentos que você domina. Semana 4: teste — 10 swings perfeitos com o peso novo. Se passou, mantém. Se
          não, volta ao peso anterior e continua.
        </p>
      </section>

      {/* ─── PAGE 16: TROUBLESHOOTING ───────────────────────── */}
      <section className="pdf-page">
        <h2>Troubleshooting</h2>

        <h3>Dor na lombar depois de swing</h3>
        <p>
          Quase sempre: hinge virou agachamento, ou você está hiperextendendo no topo. Volta ao deadlift puro por
          uma semana. Filma do lado. Compara com o padrão.
        </p>

        <h3>Ombro dói no press</h3>
        <p>
          Pode ser mobilidade torácica insuficiente. Adiciona 5 min de trabalho de torácica antes do press: cobra
          com rotação, thread the needle, cat-cow com foco na torácica.
        </p>

        <h3>Joelho dói no agachamento</h3>
        <p>
          Calcanhar saindo do chão é o culpado #1. Trabalha mobilidade de tornozelo: deep squat hold, ankle rocks.
          Se persistir, usa um calço de 2cm embaixo dos calcanhares temporariamente.
        </p>

        <h3>Não consigo fazer pigeon confortavelmente</h3>
        <p>
          Normal. Use um bloco ou travesseiro embaixo do glúteo do lado dobrado. Relaxa no apoio. Com tempo, diminui
          o apoio.
        </p>

        <h3>Respiração some durante swing</h3>
        <p>
          Desacelera. Faz em sets mais curtos (5-8 reps), descansa entre sets, volta. Prender a respiração é sinal
          de que o peso ou o volume está além do que seu sistema sustenta — ainda.
        </p>
      </section>

      {/* ─── PAGE 17: NUTRIÇÃO ──────────────────────────────── */}
      <section className="pdf-page">
        <h2>Nutrição (o que importa)</h2>
        <p>
          Esse guia não é sobre dieta. Mas sem o básico, nenhum treino funciona. Segue o mínimo inegociável.
        </p>

        <h3>Proteína</h3>
        <p>
          Pelo menos 1.6g por kg de peso corporal, por dia. Para 70kg: ~112g. Espalhado entre 3-4 refeições. Sem isso,
          o corpo não reconstrói.
        </p>

        <h3>Água</h3>
        <p>3-4 litros por dia. Comece o dia com 500ml antes do café. Simples, muda tudo.</p>

        <h3>Sono</h3>
        <p>
          7-9 horas. Não negociável. Dormir menos é treinar com metade do cartão de crédito. Se você só fizer isso e
          mais nada — já evoluiu.
        </p>

        <h3>Pré e pós-treino</h3>
        <p>
          Pré (1-2h antes): carboidrato + proteína simples. Banana com whey, ou aveia com ovos. Pós (dentro de 1h):
          refeição completa com proteína e carboidrato.
        </p>

        <h3>O que evitar antes de treinar</h3>
        <p>Refeição grande e gordurosa menos de 2h antes. Álcool no dia anterior. Café em excesso como substituto de sono.</p>

        <div className="pdf-callout">
          <strong>Verdade desconfortável:</strong> 80% dos resultados vem de dormir bem, comer proteína suficiente e
          aparecer pro treino. Otimização fina não importa enquanto o básico não tá feito.
        </div>
      </section>

      {/* ─── PAGE 18: CHECKLIST ─────────────────────────────── */}
      <section className="pdf-page">
        <h2>Checklist diário</h2>
        <p>Imprime, cola na parede, marca todo dia. Simples.</p>

        <table className="pdf-checklist">
          <thead>
            <tr>
              <th>Hábito</th>
              <th>Seg</th>
              <th>Ter</th>
              <th>Qua</th>
              <th>Qui</th>
              <th>Sex</th>
              <th>Sáb</th>
              <th>Dom</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Treino do dia</td>
              <td>KB A</td>
              <td>Yoga C</td>
              <td>Off</td>
              <td>KB B</td>
              <td>Yoga D</td>
              <td>Livre</td>
              <td>Descanso</td>
            </tr>
            <tr>
              <td>Respiração diafragmática (5 min)</td>
              {Array.from({ length: 7 }).map((_, i) => (
                <td key={i}>☐</td>
              ))}
            </tr>
            <tr>
              <td>Proteína ≥ 1.6g/kg</td>
              {Array.from({ length: 7 }).map((_, i) => (
                <td key={i}>☐</td>
              ))}
            </tr>
            <tr>
              <td>Água 3L+</td>
              {Array.from({ length: 7 }).map((_, i) => (
                <td key={i}>☐</td>
              ))}
            </tr>
            <tr>
              <td>Sono 7h+</td>
              {Array.from({ length: 7 }).map((_, i) => (
                <td key={i}>☐</td>
              ))}
            </tr>
            <tr>
              <td>Mobilidade (mesmo 5 min)</td>
              {Array.from({ length: 7 }).map((_, i) => (
                <td key={i}>☐</td>
              ))}
            </tr>
          </tbody>
        </table>

        <h3>Reavaliação no dia 30</h3>
        <p>
          No dia 30, repete a avaliação da página 5. Anota o que mudou. Espero que muita coisa. O corpo é mais
          adaptável do que ele te deixa acreditar.
        </p>
      </section>

      {/* ─── PAGE 19: PRÓXIMOS PASSOS ──────────────────────── */}
      <section className="pdf-page">
        <h2>E depois dos 30 dias?</h2>
        <p>
          Se você chegou até aqui, provavelmente duas coisas são verdade: 1) seu corpo está diferente, 2) você quer
          continuar.
        </p>

        <h3>Caminho 1 — Continuar sozinho</h3>
        <p>
          Usa esse mesmo programa por mais 30 dias, aumentando carga. Depois, rotaciona: substitui treino A por
          variações (pistol squat, one-arm swing mais pesado, double clean), troca Flow A por flows mais avançados.
          O princípio é o mesmo: integração.
        </p>

        <h3>Caminho 2 — Biblioteca Lipe Moves</h3>
        <p>
          Mais de 100 vídeos estruturados: yoga, mobilidade, kettlebell, acrobacia, respiração. Novas aulas toda
          semana. Acesso ilimitado, cancele quando quiser.
        </p>
        <p>
          <strong>Mensal:</strong> R$97/mês • <strong>Anual:</strong> R$970/ano (2 meses grátis)
          <br />
          <em>lipemoves.com/pricing</em>
        </p>

        <h3>Caminho 3 — Coaching 1-a-1</h3>
        <p>
          Programa personalizado, acompanhamento semanal por vídeo, ajustes em tempo real. Trabalho com um grupo
          pequeno por vez para manter qualidade.
        </p>
        <p>
          <strong>Interessado?</strong> Responde o email que você recebeu desse guia. Eu leio todas as respostas.
        </p>
      </section>

      {/* ─── PAGE 20: FECHAMENTO ────────────────────────────── */}
      <section className="pdf-page pdf-closing">
        <div>
          <h2>Obrigado</h2>
          <p>
            Se uma única ideia desse guia mudar como você se move — já valeu. Se ele mudar sua semana inteira, melhor.
          </p>
          <p>
            O corpo é uma coisa que a maioria das pessoas só começa a prestar atenção quando ele para de funcionar.
            Esse é o convite desse material: prestar atenção antes.
          </p>
          <p>Continue se movendo.</p>
          <p className="pdf-sign">— Lipe</p>
          <hr />
          <p className="pdf-footer-contact">
            lipemoves.com
            <br />
            @lipemoves
            <br />
            felipe.muner@gmail.com
          </p>
        </div>
      </section>
    </div>
  )
}
