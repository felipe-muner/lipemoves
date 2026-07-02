import type { CarouselContent, CarouselSlide } from "@/content/carousels/longevity"

// Instagram 4:5 portrait. One slide = 1080×1350 px.
const W = 1080
const H = 1350

const CAROUSEL_CSS = `
.carousel-root {
  --body: 'Helvetica Neue', 'Inter', Arial, sans-serif;
  --head: 'Helvetica Neue', 'Inter', Arial, sans-serif;
  --bg: #faf5ec; --text: #2e2519; --muted: #8a6f4e; --accent: #5a3210;
  --placeholder: #efe5d2; --rule: #d9c9a8;
  font-family: var(--body); color: var(--text);
  background: #2a2a2a; padding: 24px 0;
  display: flex; flex-direction: column; align-items: center; gap: 18px;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.carousel-root * { box-sizing: border-box; margin: 0; padding: 0; }
.carousel-root .slide {
  width: ${W}px; height: ${H}px; position: relative; overflow: hidden;
  background: var(--bg); box-shadow: 0 4px 28px rgba(0,0,0,.45);
}
.carousel-root img { display: block; width: 100%; height: 100%; object-fit: cover; }
.carousel-root .eyebrow {
  font-size: 24px; letter-spacing: 7px; text-transform: uppercase; color: var(--muted);
}
.carousel-root h1, .carousel-root h2 {
  font-family: var(--head); color: var(--accent); font-weight: 200;
  letter-spacing: -1px; white-space: pre-line;
}
.carousel-root p { white-space: pre-line; }
.carousel-root a { color: inherit; text-decoration: none; }

/* Footer brand + handle, present on every slide */
.carousel-root .foot {
  position: absolute; bottom: 64px; left: 90px; right: 90px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 22px; letter-spacing: 4px; text-transform: uppercase; color: var(--muted);
}
.carousel-root .swipe { display: flex; align-items: center; gap: 10px; }

/* ---- PHOTO-BACKED SLIDES (cover, photo) ---- */
.carousel-root .photo-slide .bg { position: absolute; inset: 0; }
.carousel-root .photo-slide .bg img { object-position: center top; }
.carousel-root .photo-slide .scrim {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.45) 48%, rgba(0,0,0,.88) 84%, rgba(0,0,0,.96) 100%);
}
.carousel-root .photo-slide .content {
  position: absolute; left: 90px; right: 90px; bottom: 150px; color: #fff;
}
.carousel-root .photo-slide .eyebrow { color: rgba(255,255,255,.78); margin-bottom: 24px; }
.carousel-root .photo-slide h1 { color: #fff; font-size: 54px; line-height: 1.12; margin-bottom: 26px; }
.carousel-root .photo-slide h2 { color: #fff; font-size: 54px; line-height: 1.12; margin-bottom: 26px; }
.carousel-root .photo-slide .kicker {
  font-family: var(--head); font-size: 30px; letter-spacing: 2px; color: rgba(255,255,255,.92); font-weight: 300;
}
.carousel-root .photo-slide p { font-size: 33px; line-height: 1.5; color: rgba(255,255,255,.92); max-width: 86%; }
.carousel-root .photo-slide p + p { margin-top: 22px; }
.carousel-root .photo-slide .foot { color: rgba(255,255,255,.65); }

/* ---- TEXT SLIDES (cream) ---- */
.carousel-root .text-slide {
  display: flex; flex-direction: column; justify-content: center;
  padding: 120px 90px 200px;
}
.carousel-root .text-slide .eyebrow { margin-bottom: 30px; }
.carousel-root .text-slide h2 { font-size: 84px; line-height: 1.04; margin-bottom: 30px; }
.carousel-root .text-slide .kicker {
  font-size: 32px; line-height: 1.45; color: var(--muted); font-style: italic; max-width: 88%;
}
.carousel-root .text-slide p { font-size: 33px; line-height: 1.58; color: var(--text); max-width: 92%; }
.carousel-root .text-slide p + p { margin-top: 24px; }

/* ---- PILLAR SLIDES (cream, big number) ---- */
.carousel-root .pillar-slide { display: grid; grid-template-rows: 46% 1fr; }
.carousel-root .pillar-slide .photo { overflow: hidden; position: relative; }
.carousel-root .pillar-slide .photo img { object-position: center 35%; }
.carousel-root .pillar-slide .photo .num {
  position: absolute; right: 44px; bottom: -10px; font-family: var(--head); font-weight: 200;
  font-size: 200px; line-height: 1; color: #fff; opacity: .92; text-shadow: 0 2px 24px rgba(0,0,0,.4);
}
.carousel-root .pillar-slide .body { padding: 52px 90px 130px; }
.carousel-root .pillar-slide .eyebrow { margin-bottom: 16px; }
.carousel-root .pillar-slide h2 { font-size: 78px; line-height: 1; margin-bottom: 10px; }
.carousel-root .pillar-slide .kicker {
  font-size: 32px; color: var(--muted); font-style: italic; margin-bottom: 26px;
}
.carousel-root .pillar-slide p { font-size: 30px; line-height: 1.55; color: var(--text); }
.carousel-root .pillar-slide p + p { margin-top: 18px; }

/* ---- CTA SLIDE (accent) ---- */
.carousel-root .cta-slide {
  background: var(--accent); color: var(--bg);
  display: flex; flex-direction: column; justify-content: center;
  padding: 120px 90px 200px;
}
.carousel-root .cta-slide .eyebrow { color: rgba(250,245,236,.7); margin-bottom: 30px; }
.carousel-root .cta-slide h2 { color: var(--bg); font-size: 96px; line-height: 1.0; margin-bottom: 34px; }
.carousel-root .cta-slide p { color: rgba(250,245,236,.92); font-size: 36px; line-height: 1.55; max-width: 90%; }
.carousel-root .cta-slide .kicker {
  margin-top: 44px; font-family: var(--head); font-size: 30px; letter-spacing: 4px;
  text-transform: lowercase; color: var(--bg); border-top: 1px solid rgba(250,245,236,.35);
  padding-top: 28px;
}
.carousel-root .cta-slide .foot { color: rgba(250,245,236,.6); }
`

function paragraphs(body?: string) {
  if (!body) return null
  return body.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)
}

function photoUrl(file: string) {
  return `/ebooks/photos/${file}`
}

function Foot({
  left,
  right,
  swipe,
}: {
  left: string
  right: string
  swipe?: boolean
}) {
  return (
    <div className="foot">
      <span>
        <a href="https://lipemoves.com" target="_blank" rel="noopener noreferrer">{left}</a>
      </span>
      {swipe ? <span className="swipe">Swipe →</span> : <span>{right}</span>}
    </div>
  )
}

export function CarouselRenderer({ content: c }: { content: CarouselContent }) {
  const slides = c.slides.map((s, i) => {
    const key = `slide-${i}`
    const isCover = s.kind === "cover"
    const swipe = s.swipe ?? (s.kind !== "cta")

    if (s.kind === "cover" || s.kind === "photo") {
      return (
        <section key={key} className="slide photo-slide" data-slide={i + 1}>
          {s.photo && (
            <div className="bg">
              <img src={photoUrl(s.photo)} alt="" />
            </div>
          )}
          <div className="scrim" />
          <div className="content">
            {s.eyebrow && <div className="eyebrow">{s.eyebrow}</div>}
            {isCover ? (
              <h1 style={s.titleSize ? { fontSize: s.titleSize } : undefined}>
                {s.title}
              </h1>
            ) : (
              <h2 style={s.titleSize ? { fontSize: s.titleSize } : undefined}>
                {s.title}
              </h2>
            )}
            {s.kicker && <div className="kicker">{s.kicker}</div>}
            {paragraphs(s.body)}
          </div>
          <Foot left={c.handle} right={c.brand} swipe={swipe} />
        </section>
      )
    }

    if (s.kind === "pillar") {
      return (
        <section
          key={key}
          className="slide pillar-slide"
          data-slide={i + 1}
          style={s.photoRatio ? { gridTemplateRows: `${s.photoRatio} 1fr` } : undefined}
        >
          <div className="photo">
            {s.photo && (
              <img
                src={photoUrl(s.photo)}
                alt=""
                style={s.focus ? { objectPosition: s.focus } : undefined}
              />
            )}
            {s.index && <span className="num">{s.index}</span>}
          </div>
          <div className="body">
            {s.eyebrow && <div className="eyebrow">{s.eyebrow}</div>}
            <h2>{s.title}</h2>
            {s.kicker && <div className="kicker">{s.kicker}</div>}
            {paragraphs(s.body)}
          </div>
          <Foot left={c.handle} right={c.brand} swipe={swipe} />
        </section>
      )
    }

    if (s.kind === "cta") {
      return (
        <section key={key} className="slide cta-slide" data-slide={i + 1}>
          {s.eyebrow && <div className="eyebrow">{s.eyebrow}</div>}
          <h2>{s.title}</h2>
          {paragraphs(s.body)}
          {s.kicker && (
            <div className="kicker">
              <a href="https://lipemoves.com" target="_blank" rel="noopener noreferrer">{s.kicker}</a>
            </div>
          )}
          <Foot left={c.handle} right={c.brand} swipe={swipe} />
        </section>
      )
    }

    // text
    return (
      <section key={key} className="slide text-slide" data-slide={i + 1}>
        {s.eyebrow && <div className="eyebrow">{s.eyebrow}</div>}
        <h2>{s.title}</h2>
        {s.kicker && <div className="kicker">{s.kicker}</div>}
        {paragraphs(s.body)}
        <Foot left={c.handle} right={c.brand} swipe={swipe} />
      </section>
    )
  })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CAROUSEL_CSS }} />
      <div className="carousel-root">{slides}</div>
    </>
  )
}
