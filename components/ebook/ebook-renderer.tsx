import type { EbookContent } from "@/content/ebooks/move-better"

const EBOOK_CSS = `
.ebook-root { --body: 'Helvetica Neue', 'Inter', Arial, sans-serif; --head: 'Helvetica Neue', 'Inter', Arial, sans-serif; --head-weight: 300; --bg: #faf5ec; --text: #2e2519; --muted: #8a6f4e; --accent: #5a3210; --placeholder: #efe5d2; --rule: #d9c9a8; }
.ebook-root { font-family: var(--body); color: var(--text); background: #2a2a2a; padding: 20px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.ebook-root * { box-sizing: border-box; margin: 0; padding: 0; }
.ebook-root h1, .ebook-root h2, .ebook-root h3, .ebook-root .display { font-family: var(--head); color: var(--accent); font-weight: var(--head-weight, 600); }
.ebook-root .page { width: 210mm; height: 297mm; position: relative; overflow: hidden; background: var(--bg); box-shadow: 0 4px 24px rgba(0,0,0,.4); }
.ebook-root .pad { padding: 22mm 20mm; }
.ebook-root .eyebrow { font-size: 9pt; letter-spacing: 5px; text-transform: uppercase; color: var(--muted); }
.ebook-root .brand-mark { font-size: 10pt; letter-spacing: 8px; color: var(--muted); }
.ebook-root img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ebook-root a { color: inherit; text-decoration: none; }

/* COVER */
.ebook-root .cover { display: flex; flex-direction: column; height: 297mm; min-height: 297mm; }
.ebook-root .cover-edition { position: absolute; bottom: 14mm; left: 0; right: 0; text-align: center; font-size: 9pt; letter-spacing: 4px; color: var(--muted); text-transform: uppercase; }
.ebook-root .cover-text { padding: 18mm 22mm 2mm; display: flex; flex-direction: column; }
.ebook-root .cover-text .brand-mark { margin-bottom: 16px; letter-spacing: 9px; }
.ebook-root .cover-text h1 { font-size: 54pt; line-height: 1.0; margin-bottom: 10px; letter-spacing: -1.5px; font-weight: 200; }
.ebook-root .cover-text .sub { font-size: 14pt; color: var(--muted); margin-bottom: 16px; font-style: italic; }
.ebook-root .cover-text .blurb { font-size: 11pt; line-height: 1.65; color: var(--text); max-width: 78%; white-space: pre-line; }
.ebook-root .cover-photos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 0 14mm; height: 120mm; margin-top: 100px; overflow: visible; }
.ebook-root .cover-photos .slot { border-radius: 16px; overflow: hidden; background: var(--placeholder); height: 100%; }
.ebook-root .cover-photos .slot:nth-child(2), .ebook-root .cover-photos .slot:nth-child(4) { transform: translateY(12mm); }
.ebook-root .cover-photos .slot img { object-position: center top; }

/* MANIFESTO */
.ebook-root .manifesto { position: relative; height: 100%; }
.ebook-root .manifesto .bg { position: absolute; inset: 0; }
.ebook-root .manifesto .bg img { object-position: center top; }
.ebook-root .manifesto .scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,.95) 88%, rgba(0,0,0,1) 100%); }
.ebook-root .manifesto .foot { position: absolute; bottom: 10mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; font-size: 8pt; letter-spacing: 4px; color: rgba(255,255,255,.55); text-transform: uppercase; z-index: 2; }
.ebook-root .manifesto .text { position: absolute; left: 20mm; right: 20mm; bottom: 24mm; color: #fff; }
.ebook-root .manifesto .eyebrow { color: rgba(255,255,255,.7); margin-bottom: 12px; }
.ebook-root .manifesto .display { color: #fff; font-size: 36pt; line-height: 1.15; white-space: pre-line; font-weight: 300; letter-spacing: -0.5px; }
.ebook-root .manifesto .caption { margin-top: 16px; font-size: 10pt; color: rgba(255,255,255,.7); font-style: italic; }

/* TOC */
.ebook-root .toc { padding: 26mm 22mm; }
.ebook-root .toc h2 { font-size: 36pt; margin-bottom: 10px; }
.ebook-root .toc .sub { color: var(--muted); font-size: 11pt; margin-bottom: 24mm; max-width: 75%; line-height: 1.6; }
.ebook-root .toc ol { list-style: none; counter-reset: tc; }
.ebook-root .toc li { counter-increment: tc; padding: 9px 0; border-bottom: 1px dotted var(--rule); font-size: 12pt; }
.ebook-root .toc li a { display: flex; align-items: baseline; color: var(--text); }
.ebook-root .toc li a::before { content: counter(tc, decimal-leading-zero); width: 40px; color: var(--accent); font-family: var(--head); font-weight: 600; font-size: 11pt; flex-shrink: 0; }
.ebook-root .toc li .t { color: var(--text); }
.ebook-root .toc li .dots { flex: 1; border-bottom: 1px dotted var(--rule); margin: 0 8px; transform: translateY(-4px); }

/* CHAPTERS */
.ebook-root .ch-a { display: grid; grid-template-rows: 55% auto; height: 100%; }
.ebook-root .ch-a .photo { overflow: hidden; }
.ebook-root .ch-a .photo img { object-position: center top; }
.ebook-root .ch-4 .ch-a .photo img { object-position: 70% center; }
.ebook-root .ch-a .body { padding: 12mm 20mm 16mm; }
.ebook-root .ch-a .eyebrow { margin-bottom: 6px; }
.ebook-root .ch-a h2 { font-size: 30pt; line-height: 1.05; margin-bottom: 4px; }
.ebook-root .ch-a .dek { font-size: 13pt; color: var(--muted); font-style: italic; margin-bottom: 14px; }
.ebook-root .ch-a p { font-size: 11.5pt; line-height: 1.75; margin-bottom: 10px; }
.ebook-root .ch-b .photo, .ebook-root .ch-c .photo { position: relative; }
.ebook-root .ch-b .photo::after, .ebook-root .ch-c .photo::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 32mm; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.5) 45%, rgba(0,0,0,.92) 85%, rgba(0,0,0,.98) 100%); pointer-events: none; }
.ebook-root .ch-b .foot span:first-child, .ebook-root .ch-c .foot span:last-child { color: #fff; z-index: 2; position: relative; text-shadow: 0 1px 2px rgba(0,0,0,.6); }
.ebook-root .ch-1 .ch-a { grid-template-rows: 42% auto; }
.ebook-root .ch-1 .ch-a .body { padding: 8mm 20mm 12mm; }
.ebook-root .ch-1 .ch-a p { font-size: 10pt; line-height: 1.55; margin-bottom: 7px; }
.ebook-root .ch-1 .ch-a h2 { font-size: 26pt; margin-bottom: 2px; }
.ebook-root .ch-b { display: grid; grid-template-columns: 45% 55%; height: 100%; }
.ebook-root .ch-b .photo { overflow: hidden; }
.ebook-root .ch-b .photo img { object-position: center top; }
.ebook-root .ch-b .body { padding: 26mm 18mm 18mm; display: flex; flex-direction: column; justify-content: center; }
.ebook-root .ch-b .eyebrow { margin-bottom: 8px; }
.ebook-root .ch-b h2 { font-size: 28pt; line-height: 1.05; margin-bottom: 6px; }
.ebook-root .ch-b .dek { font-size: 12pt; color: var(--muted); font-style: italic; margin-bottom: 14px; }
.ebook-root .ch-b p { font-size: 11pt; line-height: 1.75; margin-bottom: 10px; }
.ebook-root .ch-c { display: grid; grid-template-columns: 55% 45%; height: 100%; }
.ebook-root .ch-c .photo { overflow: hidden; }
.ebook-root .ch-c .photo img { object-position: center top; }
.ebook-root .ch-c .body { padding: 26mm 14mm 18mm 20mm; display: flex; flex-direction: column; justify-content: center; }
.ebook-root .ch-c .eyebrow { margin-bottom: 8px; }
.ebook-root .ch-c h2 { font-size: 28pt; line-height: 1.05; margin-bottom: 6px; }
.ebook-root .ch-c .dek { font-size: 12pt; color: var(--muted); font-style: italic; margin-bottom: 14px; }
.ebook-root .ch-c p { font-size: 11pt; line-height: 1.75; margin-bottom: 10px; }

/* QUOTE */
.ebook-root .quote { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 0 30mm; text-align: center; }
.ebook-root .quote .display { font-size: 30pt; line-height: 1.3; white-space: pre-line; font-weight: 300; }
.ebook-root .quote .mark { font-size: 60pt; color: var(--accent); opacity: .25; margin-bottom: -20px; font-family: var(--head); }

/* CTA */
.ebook-root .cta { padding: 32mm 24mm; display: flex; flex-direction: column; justify-content: center; height: 100%; }
.ebook-root .cta h2 { font-size: 38pt; line-height: 1.05; margin-bottom: 16px; }
.ebook-root .cta > p { font-size: 13pt; line-height: 1.7; color: var(--text); margin-bottom: 26px; max-width: 80%; }
.ebook-root .cta ul { list-style: none; }
.ebook-root .cta li { font-size: 13pt; padding: 12px 0; border-top: 1px solid var(--rule); color: var(--accent); font-family: var(--head); letter-spacing: 0.5px; }
.ebook-root .cta li:last-child { border-bottom: 1px solid var(--rule); }
.ebook-root .cta .offers { margin-top: 14mm; display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.ebook-root .cta .offer { padding: 8mm 8mm 9mm; background: var(--accent); color: var(--bg); border-radius: 14px; display: flex; flex-direction: column; min-height: 105mm; }
.ebook-root .cta .offer .eyebrow { color: var(--bg); opacity: 0.7; margin-bottom: 6px; font-size: 8pt; letter-spacing: 4px; }
.ebook-root .cta .offer h3 { font-family: var(--head); font-size: 18pt; font-weight: 300; line-height: 1.1; margin-bottom: 10px; letter-spacing: -0.3px; }
.ebook-root .cta .offer p { color: var(--bg); opacity: 0.9; font-size: 9.5pt; line-height: 1.55; margin-bottom: 14px; }
.ebook-root .cta .offer .offer-cta { display: inline-block; font-size: 9pt; letter-spacing: 2px; text-transform: uppercase; color: var(--bg); border-bottom: 1px solid var(--bg); padding-bottom: 2px; margin-top: auto; align-self: flex-start; }

/* CLOSING */
.ebook-root .closing { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; padding: 0 26mm; }
.ebook-root .closing h2 { font-size: 36pt; margin-bottom: 20px; }
.ebook-root .closing p { font-size: 12.5pt; line-height: 1.7; max-width: 85%; margin: 0 auto 22px; color: var(--text); }
.ebook-root .closing .sign { margin-top: 18px; font-style: italic; white-space: pre-line; color: var(--muted); font-size: 11pt; }

/* FOOTER (chapter pages) */
.ebook-root .foot { position: absolute; bottom: 10mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; font-size: 8pt; letter-spacing: 4px; color: var(--muted); text-transform: uppercase; }

/* PRINT MODE */
@media print {
  @page { size: A4; margin: 0; }
  html, body { background: #faf5ec !important; margin: 0 !important; padding: 0 !important; }
  body * { visibility: hidden !important; }
  .ebook-root, .ebook-root * { visibility: visible !important; }
  .ebook-root { position: absolute; left: 0; top: 0; background: transparent !important; padding: 0 !important; gap: 0 !important; display: block !important; }
  .ebook-root .page { box-shadow: none !important; page-break-after: always; }
  .ebook-root .page:last-child { page-break-after: auto; }
  .no-print { display: none !important; }
}
`

function paragraphs(body: string) {
  return body.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)
}

function photoUrl(file: string) {
  return `/ebooks/photos/${file}`
}

export function EbookRenderer({ content: c }: { content: EbookContent }) {
  const photo = (i: number) => photoUrl(c.photos[i])
  const pad = (n: number) => String(n).padStart(2, "0")

  const pages: React.ReactNode[] = []

  // 01 Cover
  pages.push(
    <section key="cover" className="page cover">
      <div className="cover-text">
        <h1>{c.title}</h1>
        <div className="sub">{c.subtitle}</div>
        <div className="blurb">{c.coverBlurb}</div>
      </div>
      <div className="cover-photos">
        {c.coverSlots.map((idx, i) => (
          <div key={i} className="slot">
            <img src={photo(idx)} alt="" />
          </div>
        ))}
      </div>
      <div className="cover-edition">{c.edition}</div>
    </section>,
  )

  // 02 Manifesto
  pages.push(
    <section key="manifesto" className="page">
      <div className="manifesto">
        <div className="bg">
          <img src={photo(c.manifestoPhoto)} alt="" />
        </div>
        <div className="scrim" />
        <div className="text">
          <div className="eyebrow">Manifesto</div>
          <div className="display">{c.manifesto}</div>
          <div className="caption">{c.manifestoCaption}</div>
        </div>
      </div>
    </section>,
  )

  // 03 TOC
  pages.push(
    <section key="toc" className="page">
      <div className="toc pad">
        <div className="eyebrow">{c.brand}</div>
        <h2>{c.tocTitle}</h2>
        <div className="sub">{c.tocSubtitle}</div>
        <ol>
          {c.chapters.map((ch, i) => (
            <li key={i}>
              <a href={`#chapter-${i + 1}`}>
                <span className="t">{ch.title}</span>
                <span className="dots" />
              </a>
            </li>
          ))}
          <li>
            <a href="#stay-in-touch">
              <span className="t">{c.ctaTitle}</span>
              <span className="dots" />
            </a>
          </li>
        </ol>
      </div>
    </section>,
  )

  // Chapters (with quotes inserted)
  c.chapters.forEach((ch, idx) => {
    const layout = c.layouts[idx] ?? "a"
    const num = pad(idx + 1)
    const photoSrc = photo(c.chapterPhoto[idx])

    const body = (
      <div className="body">
        <div className="eyebrow">
          {c.chapterLabel} {num}
        </div>
        <h2>{ch.title}</h2>
        {ch.dek && <div className="dek">{ch.dek}</div>}
        <p>{ch.lead}</p>
        {paragraphs(ch.body)}
      </div>
    )
    const photoDiv = (
      <div className="photo">
        <img src={photoSrc} alt="" />
      </div>
    )
    const foot = (
      <div className="foot">
        <span>{c.brand}</span>
        <span>{num}</span>
      </div>
    )

    pages.push(
      <section key={`ch-${idx}`} id={`chapter-${idx + 1}`} className={`page ch-${idx + 1}`}>
        {layout === "a" && (
          <div className="ch-a">
            {photoDiv}
            {body}
          </div>
        )}
        {layout === "b" && (
          <div className="ch-b">
            {photoDiv}
            {body}
          </div>
        )}
        {layout === "c" && (
          <div className="ch-c">
            {body}
            {photoDiv}
          </div>
        )}
        {foot}
      </section>,
    )

    if (idx === c.quoteAfter[1]) {
      pages.push(
        <section key={`q1`} className="page">
          <div className="quote">
            <div className="mark">“</div>
            <div className="display">{c.quote1}</div>
          </div>
        </section>,
      )
    }
    if (idx === c.quoteAfter[2]) {
      pages.push(
        <section key={`q2`} className="page">
          <div className="quote">
            <div className="mark">“</div>
            <div className="display">{c.quote2}</div>
          </div>
        </section>,
      )
    }
  })

  // CTA
  pages.push(
    <section key="cta" id="stay-in-touch" className="page">
      <div className="cta">
        <div className="eyebrow">{c.ctaEyebrow}</div>
        <h2>{c.ctaTitle}</h2>
        <p>{c.ctaText}</p>
        <ul>
          {c.ctaLinks.map((l, i) => (
            <li key={i}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="offers">
          {c.offers.map((o, i) => (
            <div key={i} className="offer">
              <div className="eyebrow">{o.eyebrow}</div>
              <h3>{o.title}</h3>
              <p>{o.text}</p>
              <a className="offer-cta" href={o.ctaHref}>
                {o.ctaLabel}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>,
  )

  // Closing
  pages.push(
    <section key="closing" className="page">
      <div className="closing">
        <div className="eyebrow">{c.brand}</div>
        <h2>{c.closingTitle}</h2>
        {paragraphs(c.closingText)}
        <div className="sign">{c.closingSign}</div>
      </div>
    </section>,
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EBOOK_CSS }} />
      <div className="ebook-root">{pages}</div>
    </>
  )
}
