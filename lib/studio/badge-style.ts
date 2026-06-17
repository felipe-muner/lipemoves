// Shared look for the enumerate badge, used by BOTH the studio preview
// (EnumBadge in StudioClient) and the Chromium burn (badge.ts) so where you
// drop it on screen is exactly what burns. No server-only imports here — this
// is safe to pull into the client bundle.
//
// Two styles:
//  - "pill":   the classic translucent grey pill with dark text ("✅ 1/5").
//  - "grunge": heavy white text with a soft drop shadow ("shade") and a faint,
//              irregular speckle of black grain scattered over it.

export type BadgeStyle = "pill" | "grunge"

// Fine fractal-noise grain. We push the turbulence into the ALPHA channel (RGB
// forced to black) and gamma-shape it — used as a plain alpha mask (works in
// Chromium's burn and every modern browser). On its own it's a speckle; we
// INTERSECT it with a diagonal hatch (below) so the result is broken inky
// hatch lines — the printed/letterpress distress in the reference labels.
// Tweak: higher baseFrequency = finer grain · lower exponent = more grain.
const GRUNGE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
  "<filter id='g'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.85 0.85' numOctaves='2' seed='7' stitchTiles='stitch'/>" +
  "<feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.5 0.5 0.5 0 0'/>" +
  "<feComponentTransfer><feFuncA type='gamma' exponent='0.9' amplitude='1.2' offset='0'/></feComponentTransfer>" +
  "</filter>" +
  "<rect width='100%' height='100%' filter='url(#g)'/>" +
  "</svg>"

const GRUNGE_GRAIN = `url("data:image/svg+xml,${encodeURIComponent(GRUNGE_SVG)}")`

// Thin diagonal ink lines (em-based so the hatch density scales with the font
// in both the small preview and the big burn). Intersected with the grain
// above to break the lines up. Tweak the line/period for denser/sparser hatch.
const GRUNGE_HATCH =
  "repeating-linear-gradient(125deg, #000 0, #000 0.04em, transparent 0.04em, transparent 0.1em)"

/** @font-face declaration for the grunge badge's Outfit family, given the TTF
 *  source. The preview points it at the public copy (/fonts/Outfit-600.ttf);
 *  the burn inlines it as a data URI so it needs no server. Same file both
 *  ways, so the preview matches the render. */
export function outfitFontFace(src: string): string {
  return `@font-face {
  font-family: "OutfitBadge";
  src: url("${src}") format("truetype");
  font-weight: 600;
  font-style: normal;
  font-display: block;
}`
}

/** The full CSS (no selector wrapping) for the badge classes. Inject once into
 *  a <style> tag in the preview and into badge.ts's burn <style>. Placement
 *  (left/top/transform) and font-size stay inline since they differ per use. */
export function badgeStyleCss(): string {
  return `
.lm-badge {
  white-space: nowrap;
  font-family: -apple-system, "SF Pro Display", "Segoe UI", sans-serif;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
}
.lm-badge--pill {
  display: inline-flex;
  align-items: center;
  padding: 0.306em 0.556em;
  border-radius: 0.389em;
  background: rgba(232, 232, 232, 0.62);
  color: #161616;
  font-weight: 800;
}
.lm-badge--grunge {
  font-family: "OutfitBadge", var(--font-outfit), system-ui, sans-serif;
  font-weight: 600;
  color: #ffffff;
  /* thin dark edge so the white reads on busy footage */
  -webkit-text-stroke: 0.02em #1a1a1a;
  paint-order: stroke fill;
  /* soft drop shadow for depth ("the shadow") */
  text-shadow: 0 0.03em 0.06em rgba(0, 0, 0, 0.45);
}
.lm-badge--grunge::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  /* inky black distress printed into the white letters: a diagonal hatch
     broken up by fine grain (mask intersect) */
  color: #141414;
  -webkit-text-stroke: 0;
  -webkit-mask-image: ${GRUNGE_GRAIN}, ${GRUNGE_HATCH};
  mask-image: ${GRUNGE_GRAIN}, ${GRUNGE_HATCH};
  -webkit-mask-repeat: repeat, repeat;
  mask-repeat: repeat, repeat;
  -webkit-mask-size: 0.5em 0.5em, auto;
  mask-size: 0.5em 0.5em, auto;
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  opacity: 0.9;
  pointer-events: none;
}
`.trim()
}

/** Class list for a badge of the given style. */
export function badgeClass(style: BadgeStyle): string {
  return `lm-badge lm-badge--${style}`
}
