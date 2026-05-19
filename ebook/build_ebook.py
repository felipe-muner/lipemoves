#!/usr/bin/env python3
"""Generate LipeMoves ebook PDFs — editorial style, 3 themes x 2 langs."""
import subprocess, html
from pathlib import Path

PHOTO_DIR = Path(__file__).resolve().parent
OUT_DIR = PHOTO_DIR
PHOTOS = sorted([p for p in PHOTO_DIR.glob("*.jpg")])
P = [f"file://{p}" for p in PHOTOS]
assert len(P) >= 11

# --- Content -------------------------------------------------------------

CONTENT = {
    "pt": {
        "brand": "FELIPE MUNER",
        "title": "Move Better",
        "subtitle": "Rotina alimentar e de movimento",
        "author": "Felipe Muner",
        "edition": "Edição 01 · 2026",
        "chapter_label": "Capítulo",
        "cover_blurb": "Depois de anos em movimento, cheguei a uma fórmula simples que funciona pra mim. Aqui está, sem rodeios.",
        "manifesto": "Coma menos vezes.\nMova-se todo dia.\nRespire devagar.",
        "manifesto_caption": "O essencial cabe em quatro linhas.",
        "toc_title": "O que tem aqui",
        "toc_subtitle": "Um guia curto e direto — leia em 20 minutos, aplique pelo resto da vida.",
        "chapters": [
            ("Quem sou eu",
             "Brasileiro vivendo em Koh Phangan.",
             "Sou Felipe. Esse guia nasce de uma busca pessoal: como me sentir leve, forte e presente todos os dias. Não é uma dieta. É o que eu faço — e como cheguei aqui depois de anos testando, errando e ajustando.",
             "Não tem segredo. Só consistência."),

            ("A fórmula",
             "Tudo num parágrafo só.",
             "Jejum até as 17h. Uma refeição por dia, abundante e simples: frutas, verduras e proteína (frango, peixe ou ovos). Pela manhã, limão com sal himalaia. À tarde e à noite, kettlebell, respiração e movimento controlado com atenção plena.",
             "É isso. O resto deste guia é sobre o porquê e o como."),

            ("Jejum até as 17h",
             "O corpo agradece.",
             "Não como nada sólido durante o dia. Água, água com limão e sal, chá. O corpo entra num estado calmo e focado — sem altos e baixos, sem o peso da digestão. Sendo honesto: não faço isso todos os dias. Mas quanto mais faço, melhor me sinto — e nenhuma outra abordagem que tentei chegou perto.",
             "Para entrar nesse ritmo, adiante a última refeição 15 minutos por dia. O corpo precisa de tempo pra se adaptar — forçar de uma vez gera fome ansiosa e desiste. Em duas semanas, 17h vira natural.\n\nÀ noite, prefira proteína e comida leve — evite carregar o corpo com carboidratos pesados antes de dormir. Isso muda o sono, a recuperação e como você acorda no dia seguinte."),

            ("Limão + sal himalaia",
             "Meu café da manhã.",
             "Pela manhã: um copo de água, suco de meio limão, uma pitada generosa de sal rosa do Himalaia.",
             "Hidrata, mineraliza, acorda o corpo. Sem cafeína, sem açúcar, sem digestão pesada. Simples e poderoso."),

            ("Frutas, e muitas",
             "Tem dia que como 10.",
             "Começo a refeição com frutas. Bastantes. Manga, mamão, banana, melancia, abacaxi — o que estiver maduro e doce no mercado.",
             "Açúcar de fruta com fibra e água é combustível limpo. Energia imediata, sem inflamar."),

            ("Verduras",
             "Volume sem peso.",
             "Depois das frutas: salada e verduras. Folhas verdes, pepino, tomate, cenoura, alface, brotos. Sem molhos pesados — azeite, limão, sal, ervas.",
             "Fibra, minerais, saciedade. O prato pesado da rotina, mas leve no corpo."),

            ("Proteína simples",
             "Frango, peixe, ovos.",
             "Por último, a proteína: grelhada, no vapor ou cozida. Nunca frita, nunca com molho industrial.",
             "O sabor vem do alimento, não do que você coloca em cima."),

            ("Kettlebell",
             "Um peso, o corpo todo.",
             "Meu treino principal: kettlebell. Swing, clean, snatch, get-up. Pouco equipamento, máximo resultado.",
             "Cinco a vinte minutos, três a cinco vezes por semana. Não precisa de mais."),

            ("Respiração + músculo",
             "O segredo não é o peso.",
             "É como você se move. Apertar o músculo, contrair com intenção, respirar junto. Cada movimento é uma conversa entre mente e corpo.",
             "Movimento rápido sem consciência é só queimar caloria. Movimento lento e atento constrói força real."),

            ("Mindfulness no movimento",
             "Treinar é meditar.",
             "Quando treino, eu treino. Sem celular, sem música alta, sem pressa. Sinto cada movimento por inteiro.",
             "O treino vira meditação ativa. Você sai melhor do que entrou — não só fisicamente."),

            ("Como começar",
             "Devagar e sempre.",
             "Estenda o jejum aos poucos: pule o café da manhã primeiro, depois empurre o almoço. Em algumas semanas, 17h vira fácil.",
             "Movimente todos os dias, mesmo que sejam 5 minutos. Consistência vence intensidade. Este é o meu caminho — encontre o seu."),
        ],
        "quote_1": "“O essencial é\ncomer menos vezes\ne se mover melhor.”",
        "quote_2": "“Movimento lento\ne atento constrói\nforça real.”",
        "cta_eyebrow": "Próximo passo",
        "cta_title": "Continue comigo",
        "cta_text": "Se este guia te ajudou, me conta. Me chama no Instagram ou no email — adoro ouvir histórias.",
        "offer_eyebrow": "Coaching 1:1",
        "offer_title": "Trabalhe comigo direto",
        "offer_text": "Atendo poucos alunos 1:1 por mês. Juntos a gente monta o seu plano completo — movimento, alimentação, ritmo de jejum, respiração e cabeça — adaptado ao seu corpo, sua rotina e seus objetivos. Chamadas remotas, check-ins semanais, responsabilidade de verdade. Me manda mensagem e te digo se faz sentido pra você.",
        "cta_links": [
            ("WhatsApp · +55 21 98485-2802", "https://wa.me/5521984852802"),
            ("Instagram · @felipeenjoylife", "https://instagram.com/felipeenjoylife"),
            ("Email · felipe.muner@gmail.com", "mailto:felipe.muner@gmail.com"),
        ],
        "closing_title": "Obrigado",
        "closing_text": "Este guia é um resumo honesto do que eu faço. Não é receita médica nem promessa. É um convite pra você experimentar, escutar seu corpo e construir a sua própria fórmula.",
        "closing_sign": "Com gratidão,\nFelipe Muner",
    },
    "en": {
        "brand": "FELIPE MUNER",
        "title": "Move Better",
        "subtitle": "Food and movement routine",
        "author": "Felipe Muner",
        "edition": "Edition 01 · 2026",
        "chapter_label": "Chapter",
        "cover_blurb": "After years in motion, I arrived at a simple formula that works for me. Here it is, no fluff.",
        "manifesto": "Eat fewer times.\nMove every day.\nBreathe slowly.",
        "manifesto_caption": "The essential fits in four lines.",
        "toc_title": "What's inside",
        "toc_subtitle": "A short, direct guide — read in 20 minutes, apply for the rest of your life.",
        "chapters": [
            ("Who I am",
             "",
             "I'm Felipe. This guide is born from a personal search: how to feel strong, flexible and jacked all year round — so every day brings more energy to enjoy life. It's not a diet. It's what I do — and how I got here after years of trying, failing and adjusting.",
             "There's no secret. Just consistency."),

            ("The formula",
             "Everything in one paragraph.",
             "Fast until 5pm. One meal a day, abundant and simple: fruit, vegetables and protein (chicken, fish or eggs). In the morning, lemon with Himalayan salt. During the day, breath and controlled mindful movement: yoga, calisthenics, kettlebell. Personally, I aim for longevity — I'd rather play with free weights and my own body than do static exercises on gym machines.",
             "That's it. The rest of this guide is about the why and the how.\n\nHonestly: I don't do this every day. But the more I do it, the better I feel — and no other approach I've tried comes close."),

            ("Fasting until 5pm",
             "The body thanks you.",
             "I eat no solid food during the day. Water, water with lemon and salt, tea. The body settles into a calm, focused state — no spikes, no weight of digestion. All effort activities should be done before the fast is broken. With time, it will sharpen your life positively.",
             "To ease in, push your last meal 15 minutes later each day. The body needs time to adjust — forcing it all at once just creates anxious hunger and you quit. In two weeks, 5pm feels natural.\n\nAt night, lean toward protein and light food — avoid loading the body with heavy carbs before sleep. It changes your sleep, your recovery, and how you wake up the next day."),

            ("Lemon + Himalayan salt",
             "My breakfast.",
             "In the morning: a glass of water (sometimes none), juice of half a lemon, a generous pinch of pink Himalayan salt.",
             "Hydrates, mineralizes, wakes the body. No caffeine, no sugar, no heavy digestion. Simple and powerful."),

            ("Fruit, and lots of it",
             "Some days I eat 10.",
             "The best scenario is to make a juice at 5pm — variety always. Mango, papaya, banana, watermelon, coconut water, pineapple — whatever is ripe and sweet at the market.",
             "Never forget to mix in ginger, turmeric, cinnamon, oats, chia, flaxseed, cherries, goji berries — seeds and roots are welcome. Just blend it all together. Fruit sugar with fiber and water is clean fuel: instant energy, no inflammation."),

            ("Vegetables",
             "Volume without weight.",
             "After fruit: salad and vegetables. Greens, cucumber, tomato, carrot, lettuce, sprouts. No heavy dressings — olive oil, lemon, salt, herbs.",
             "Fiber, minerals, fullness. The heavy plate of the routine, but light in the body."),

            ("Smart carbs",
             "Slow-burning fuel.",
             "Living on the island, fresh produce is everywhere. My go-to carbs: sweet potato, pumpkin (fak thong) and papaya — green or ripe. Ripe papaya is great for digestion and gives quick carbs plus enzymes; green papaya turns into som tam, the savory side. Pumpkin shows up in Thai curries and stir-fries; roasted sweet potato is sold at every market.",
             "I blend raw or steamed sweet potato into my juices — it thickens the drink and stretches the energy for hours. Slow-digesting, rich in fiber and micronutrients, perfect on kettlebell training days."),

            ("Simple protein",
             "Chicken, fish, eggs.",
             "Last, the protein: grilled, steamed or boiled. Never fried, never with industrial sauces or packaged seasonings.",
             "The flavor comes from the food itself, not what you put on top."),

            ("Kettlebell",
             "One weight, the whole body.",
             "My main training: kettlebell. Swing, clean, snatch, get-up. Minimal equipment, maximum results.",
             "Five to twenty minutes, three to five times a week. No more needed."),

            ("Breath + muscle",
             "The secret isn't the weight.",
             "It's how you move. Squeeze the muscle, contract with intention, sync your breath and your gaze with the movement. Each motion is a conversation between mind and body.",
             "Fast movement without awareness is just burning calories. Slow, attentive movement builds real strength and balance."),

            ("Eyes focused",
             "Where the eyes go, the body follows.",
             "Train your gaze like you train your body. Fix your eyes on a single point during a kettlebell swing, on the horizon during a get-up, on the hand that moves during a clean. The eyes anchor the nervous system — they tell the body it is safe, focused, and in control.",
             "Soft gaze, hard intention. No darting around, no checking the mirror, no looking at the phone. When the eyes settle, the breath settles, and the movement becomes precise. Keep the prana flowing."),

            ("Mindfulness in motion",
             "To train is to meditate.",
             "When I train, I train. No phone, no loud music, no sitting, no rush. I feel each movement, fully.",
             "Training becomes active meditation. You leave better than you came in — and not just physically."),

            ("How to start",
             "Slow and steady.",
             "Extend the fast gradually: skip breakfast first, then push lunch. In a few weeks, 5pm becomes easy.",
             "Move every day, even if just 5 minutes. Consistency beats intensity. This is my path — find yours."),
        ],
        "quote_1": "“The essential is\nto eat fewer times\nand move better.”",
        "quote_2": "“Slow attentive\nmovement builds\nreal strength.”",
        "cta_title": "Stay in touch",
        "cta_text": "If this guide helped you, let me know. Reach me on Instagram or by email — I love hearing your story.",
        "offer_eyebrow": "1:1 Coaching",
        "offer_title": "Work with me directly",
        "offer_text": "I take a small number of 1:1 clients each month. Together we build your full plan — movement, food, fasting rhythm, breath and mindset — adapted to your body, your routine and your goals. Remote calls, weekly check-ins, real accountability. Send me a message and I'll tell you if it's a fit.",
        "cta_links": [
            ("WhatsApp · +55 21 98485-2802", "https://wa.me/5521984852802"),
            ("Instagram · @felipeenjoylife", "https://instagram.com/felipeenjoylife"),
            ("Email · felipe.muner@gmail.com", "mailto:felipe.muner@gmail.com"),
        ],
        "closing_title": "Thank you",
        "closing_text": "This guide is an honest summary of what I do. It is not medical advice and not a promise. It's an invitation for you to experiment, listen to your body and build your own formula.",
        "closing_sign": "With gratitude,\nFelipe Muner",
    },
}

# Photo assignment per chapter (index into P)
CH_PHOTO = [4, 5, 6, 7, 8, 9, 10, 0, 1, 2, 3, 4, 5]
# Object-position default (focus toward upper body for portrait crops)
OBJ_POS = "center top"

# --- CSS -----------------------------------------------------------------

BASE_CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 210mm; }
body { font-family: var(--body); color: var(--text); background: var(--bg); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; background: var(--bg); }
.page:last-child { page-break-after: auto; }
.pad { padding: 22mm 20mm; }
h1, h2, h3, .display { font-family: var(--head); color: var(--accent); font-weight: var(--head-weight, 600); }
.eyebrow { font-size: 9pt; letter-spacing: 5px; text-transform: uppercase; color: var(--muted); }
.brand-mark { font-size: 10pt; letter-spacing: 8px; color: var(--muted); }
img { display: block; width: 100%; height: 100%; object-fit: cover; }

/* ===== COVER ===== */
.cover { display: flex; flex-direction: column; height: 297mm; min-height: 297mm; }
.cover-edition { position: absolute; bottom: 14mm; left: 0; right: 0; text-align: center; font-size: 9pt; letter-spacing: 4px; color: var(--muted); text-transform: uppercase; }
.cover-text { padding: 18mm 22mm 2mm; display: flex; flex-direction: column; justify-content: flex-start; }
.cover-text .brand-mark { margin-bottom: 16px; letter-spacing: 9px; }
.cover-text h1 { font-size: 54pt; line-height: 1.0; margin-bottom: 10px; letter-spacing: -1.5px; font-weight: 200; }
.cover-text .sub { font-size: 14pt; color: var(--muted); margin-bottom: 16px; font-style: italic; }
.cover-text .blurb { font-size: 11pt; line-height: 1.65; color: var(--text); max-width: 78%; }
.cover-text .author-row { margin-top: auto; padding-top: 14px; display: flex; justify-content: space-between; font-size: 9pt; letter-spacing: 3px; color: var(--muted); text-transform: uppercase; }
.cover-photos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 0 14mm; height: 120mm; margin-top: 100px; overflow: visible; }
.cover-photos .slot { border-radius: 16px; overflow: hidden; background: var(--placeholder); height: 100%; }
.cover-photos .slot:nth-child(2), .cover-photos .slot:nth-child(4) { transform: translateY(12mm); }
.cover-photos .slot img { object-position: """ + OBJ_POS + """; }

/* ===== MANIFESTO PAGE (full-bleed photo + overlay text) ===== */
.manifesto { position: relative; height: 100%; }
.manifesto .bg { position: absolute; inset: 0; }
.manifesto .bg img { object-position: center top; }
.manifesto .scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.55) 60%, rgba(0,0,0,.85) 100%); }
.manifesto .text { position: absolute; left: 20mm; right: 20mm; bottom: 24mm; color: #fff; }
.manifesto .eyebrow { color: rgba(255,255,255,.7); margin-bottom: 12px; }
.manifesto .display { color: #fff; font-size: 36pt; line-height: 1.15; white-space: pre-line; font-weight: 300; letter-spacing: -0.5px; }
.manifesto .caption { margin-top: 16px; font-size: 10pt; color: rgba(255,255,255,.7); font-style: italic; }

/* ===== TOC ===== */
.toc { padding: 26mm 22mm; }
.toc h2 { font-size: 36pt; margin-bottom: 10px; }
.toc .sub { color: var(--muted); font-size: 11pt; margin-bottom: 24mm; max-width: 75%; line-height: 1.6; }
.toc ol { list-style: none; counter-reset: tc; }
.toc li { counter-increment: tc; padding: 9px 0; border-bottom: 1px dotted var(--rule); font-size: 12pt; }
.toc li a { display: flex; align-items: baseline; text-decoration: none; color: var(--text); }
.toc li a::before { content: counter(tc, decimal-leading-zero); width: 40px; color: var(--accent); font-family: var(--head); font-weight: 600; font-size: 11pt; flex-shrink: 0; }
.toc li .t { color: var(--text); }
.toc li .dots { flex: 1; border-bottom: 1px dotted var(--rule); margin: 0 8px; transform: translateY(-4px); }
.cta li a { color: inherit; text-decoration: none; }
a { color: inherit; }

/* ===== CHAPTER LAYOUTS ===== */
/* Layout A: large top photo, text below */
.ch-a { display: grid; grid-template-rows: 55% auto; height: 100%; }
.ch-a .photo { overflow: hidden; }
.ch-a .photo img { object-position: """ + OBJ_POS + """; }
.ch-a .body { padding: 12mm 20mm 16mm; }
.ch-a .eyebrow { margin-bottom: 6px; }
.ch-a h2 { font-size: 30pt; line-height: 1.05; margin-bottom: 4px; }
.ch-a .dek { font-size: 13pt; color: var(--muted); font-style: italic; margin-bottom: 14px; }
.ch-a p { font-size: 11.5pt; line-height: 1.75; margin-bottom: 10px; }

/* Layout B: side-by-side, photo left, text right */
.ch-b { display: grid; grid-template-columns: 45% 55%; height: 100%; }
.ch-b .photo { overflow: hidden; }
.ch-b .photo img { object-position: center top; }
.ch-b .body { padding: 26mm 18mm 18mm; display: flex; flex-direction: column; justify-content: center; }
.ch-b .eyebrow { margin-bottom: 8px; }
.ch-b h2 { font-size: 28pt; line-height: 1.05; margin-bottom: 6px; }
.ch-b .dek { font-size: 12pt; color: var(--muted); font-style: italic; margin-bottom: 14px; }
.ch-b p { font-size: 11pt; line-height: 1.75; margin-bottom: 10px; }

/* Layout C: side-by-side reversed, text left, photo right */
.ch-c { display: grid; grid-template-columns: 55% 45%; height: 100%; }
.ch-c .photo { overflow: hidden; }
.ch-c .photo img { object-position: center top; }
.ch-c .body { padding: 26mm 14mm 18mm 20mm; display: flex; flex-direction: column; justify-content: center; }
.ch-c .eyebrow { margin-bottom: 8px; }
.ch-c h2 { font-size: 28pt; line-height: 1.05; margin-bottom: 6px; }
.ch-c .dek { font-size: 12pt; color: var(--muted); font-style: italic; margin-bottom: 14px; }
.ch-c p { font-size: 11pt; line-height: 1.75; margin-bottom: 10px; }

/* ===== QUOTE PAGE ===== */
.quote { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 0 30mm; text-align: center; }
.quote .display { font-size: 30pt; line-height: 1.3; white-space: pre-line; font-weight: 300; }
.quote .mark { font-size: 60pt; color: var(--accent); opacity: .25; margin-bottom: -20px; font-family: var(--head); }

/* ===== CTA ===== */
.cta { padding: 32mm 24mm; display: flex; flex-direction: column; justify-content: center; height: 100%; }
.cta h2 { font-size: 38pt; line-height: 1.05; margin-bottom: 16px; }
.cta p { font-size: 13pt; line-height: 1.7; color: var(--text); margin-bottom: 26px; max-width: 80%; }
.cta ul { list-style: none; }
.cta li { font-size: 13pt; padding: 12px 0; border-top: 1px solid var(--rule); color: var(--accent); font-family: var(--head); letter-spacing: 0.5px; }
.cta li:last-child { border-bottom: 1px solid var(--rule); }
.cta .offer { margin-top: 22mm; padding: 10mm 10mm 11mm; background: var(--accent); color: var(--bg); border-radius: 14px; }
.cta .offer .eyebrow { color: var(--bg); opacity: 0.7; margin-bottom: 6px; }
.cta .offer h3 { font-family: var(--head); font-size: 22pt; font-weight: 300; line-height: 1.1; margin-bottom: 10px; letter-spacing: -0.3px; }
.cta .offer p { color: var(--bg); opacity: 0.9; font-size: 11pt; line-height: 1.6; max-width: 100%; margin-bottom: 14px; }
.cta .offer .offer-cta { display: inline-block; font-size: 11pt; letter-spacing: 2px; text-transform: uppercase; color: var(--bg); text-decoration: none; border-bottom: 1px solid var(--bg); padding-bottom: 2px; }

/* ===== CLOSING ===== */
.closing { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; padding: 0 26mm; }
.closing h2 { font-size: 36pt; margin-bottom: 20px; }
.closing p { font-size: 12.5pt; line-height: 1.7; max-width: 85%; margin: 0 auto 22px; color: var(--text); }
.closing .sign { margin-top: 18px; font-style: italic; white-space: pre-line; color: var(--muted); font-size: 11pt; }

/* ===== FOOTER ===== */
.foot { position: absolute; bottom: 10mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; font-size: 8pt; letter-spacing: 4px; color: var(--muted); text-transform: uppercase; }
"""

THEMES = {
    "final": """
        :root {
          --body: 'Helvetica Neue', 'Inter', Arial, sans-serif;
          --head: 'Helvetica Neue', 'Inter', Arial, sans-serif;
          --head-weight: 300;
          --bg: #faf5ec; --text: #2e2519; --muted: #8a6f4e; --accent: #5a3210;
          --placeholder: #efe5d2; --rule: #d9c9a8;
        }
        h1, h2 { letter-spacing: -0.8px; }
    """,
}

# --- Build ---------------------------------------------------------------

def esc(s): return html.escape(s)

LAYOUTS = ["a", "b", "c", "a", "b", "c", "a", "b", "c", "a", "b", "c", "a"]

def cover(c):
    slots = "".join(f'<div class="slot"><img src="{P[i]}"/></div>' for i in [0,1,2,3])
    return f"""
    <section class="page cover">
      <div class="cover-text">
        <h1>{esc(c['title'])}</h1>
        <div class="sub">{esc(c['subtitle'])}</div>
        <div class="blurb">{esc(c['cover_blurb'])}</div>
      </div>
      <div class="cover-photos">{slots}</div>
      <div class="cover-edition">{esc(c['edition'])}</div>
    </section>"""

def manifesto(c, photo_idx=5):
    return f"""
    <section class="page">
      <div class="manifesto">
        <div class="bg"><img src="{P[photo_idx]}"/></div>
        <div class="scrim"></div>
        <div class="text">
          <div class="eyebrow">Manifesto</div>
          <div class="display">{esc(c['manifesto'])}</div>
          <div class="caption">{esc(c['manifesto_caption'])}</div>
        </div>
      </div>
    </section>"""

def toc(c):
    items = "".join(
        f'<li><a href="#ch-{i+1}"><span class="t">{esc(title)}</span><span class="dots"></span></a></li>'
        for i, (title, _dek, _lead, _body) in enumerate(c['chapters'])
    )
    return f"""
    <section class="page">
      <div class="toc pad">
        <div class="eyebrow">{esc(c['brand'])}</div>
        <h2>{esc(c['toc_title'])}</h2>
        <div class="sub">{esc(c['toc_subtitle'])}</div>
        <ol>{items}</ol>
      </div>
    </section>"""

def chapter(c, idx, layout):
    title, dek, lead, body = c['chapters'][idx]
    photo = P[CH_PHOTO[idx]]
    num = f"{idx+1:02d}"
    if layout == "a":
        return f"""
        <section class="page" id="ch-{idx+1}">
          <div class="ch-a">
            <div class="photo"><img src="{photo}"/></div>
            <div class="body">
              <div class="eyebrow">{esc(c["chapter_label"])} {num}</div>
              <h2>{esc(title)}</h2>
              <div class="dek">{esc(dek)}</div>
              <p>{esc(lead)}</p>
              {"".join(f"<p>{esc(par)}</p>" for par in body.split(chr(10)+chr(10)))}
            </div>
          </div>
          <div class="foot"><span>{esc(c['brand'])}</span><span>{num}</span></div>
        </section>"""
    elif layout == "b":
        return f"""
        <section class="page" id="ch-{idx+1}">
          <div class="ch-b">
            <div class="photo"><img src="{photo}"/></div>
            <div class="body">
              <div class="eyebrow">{esc(c["chapter_label"])} {num}</div>
              <h2>{esc(title)}</h2>
              <div class="dek">{esc(dek)}</div>
              <p>{esc(lead)}</p>
              {"".join(f"<p>{esc(par)}</p>" for par in body.split(chr(10)+chr(10)))}
            </div>
          </div>
          <div class="foot"><span>{esc(c['brand'])}</span><span>{num}</span></div>
        </section>"""
    else:  # c
        return f"""
        <section class="page" id="ch-{idx+1}">
          <div class="ch-c">
            <div class="body">
              <div class="eyebrow">{esc(c["chapter_label"])} {num}</div>
              <h2>{esc(title)}</h2>
              <div class="dek">{esc(dek)}</div>
              <p>{esc(lead)}</p>
              {"".join(f"<p>{esc(par)}</p>" for par in body.split(chr(10)+chr(10)))}
            </div>
            <div class="photo"><img src="{photo}"/></div>
          </div>
          <div class="foot"><span>{esc(c['brand'])}</span><span>{num}</span></div>
        </section>"""

def quote(text):
    return f"""
    <section class="page">
      <div class="quote">
        <div class="mark">“</div>
        <div class="display">{esc(text).replace('“','').replace('”','')}</div>
      </div>
    </section>"""

def cta(c):
    links = "".join(f'<li><a href="{href}">{esc(label)}</a></li>' for label, href in c['cta_links'])
    offer = ""
    if c.get('offer_title'):
        offer = f"""
        <div class="offer">
          <div class="eyebrow">{esc(c.get('offer_eyebrow', '1:1 Coaching'))}</div>
          <h3>{esc(c['offer_title'])}</h3>
          <p>{esc(c['offer_text'])}</p>
          <a class="offer-cta" href="https://wa.me/5521984852802?text=Hi%20Felipe%2C%20I%27m%20interested%20in%201%3A1%20coaching">Apply for 1:1 on WhatsApp →</a>
        </div>"""
    return f"""
    <section class="page">
      <div class="cta">
        <div class="eyebrow">{esc(c.get('cta_eyebrow', 'Next step'))}</div>
        <h2>{esc(c['cta_title'])}</h2>
        <p>{esc(c['cta_text'])}</p>
        <ul>{links}</ul>
        {offer}
      </div>
    </section>"""

def closing(c):
    return f"""
    <section class="page">
      <div class="closing">
        <div class="eyebrow">{esc(c['brand'])}</div>
        <h2>{esc(c['closing_title'])}</h2>
        <p>{esc(c['closing_text'])}</p>
        <div class="sign">{esc(c['closing_sign'])}</div>
      </div>
    </section>"""

def build_html(lang, theme):
    c = CONTENT[lang]
    pages = [cover(c), manifesto(c, photo_idx=5), toc(c)]
    for i in range(len(c['chapters'])):
        pages.append(chapter(c, i, LAYOUTS[i]))
        if i == 3:
            pages.append(quote(c['quote_1']))
        if i == 8:
            pages.append(quote(c['quote_2']))
    pages.append(cta(c))
    pages.append(closing(c))
    css = BASE_CSS + THEMES[theme]
    return f"""<!DOCTYPE html>
<html lang="{lang}"><head><meta charset="UTF-8"><title>{esc(c['title'])}</title>
<style>{css}</style></head><body>{''.join(pages)}</body></html>"""

def main():
    chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    for lang in ("en",):
        html_path = Path(f"/tmp/lipemoves_{lang}.html")
        html_path.write_text(build_html(lang, "final"))
        pdf_path = OUT_DIR / f"Move-Better-{lang.upper()}.pdf"
        subprocess.run([
            chrome, "--headless", "--disable-gpu", "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}", f"file://{html_path}"
        ], capture_output=True)
        print(f"OK {pdf_path.name} ({pdf_path.stat().st_size//1024} KB)")

if __name__ == "__main__":
    main()
