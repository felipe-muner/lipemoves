// Curated fonts for studio text labels. Each one exists BOTH as a browser font
// (for the live preview's CSS) and as a file ImageMagick can render (for the
// burn), so what you place on screen matches the rendered video. The server
// maps the key → font file in scripts/label-video.sh.

export type FontKey =
  | "outfit"
  | "archivo"
  | "impact"
  | "georgia"
  | "script"
  | "mono"

export interface FontDef {
  key: FontKey
  label: string
  /** font-family used for the live preview. */
  css: string
  /** font-weight for the preview (when the family is variable/multi-weight). */
  weight?: number
}

export const FONTS: FontDef[] = [
  {
    key: "outfit",
    label: "Outfit",
    css: "var(--font-outfit), system-ui, sans-serif",
    weight: 600,
  },
  {
    key: "archivo",
    label: "Archivo Black",
    css: '"Archivo Black", system-ui, sans-serif',
  },
  { key: "impact", label: "Impact", css: 'Impact, Haettenschweiler, sans-serif' },
  {
    key: "georgia",
    label: "Georgia",
    css: 'Georgia, "Times New Roman", serif',
    weight: 700,
  },
  {
    key: "script",
    label: "Brush Script",
    css: '"Brush Script MT", "Snell Roundhand", cursive',
  },
  { key: "mono", label: "Courier", css: '"Courier New", ui-monospace, monospace' },
]

export const DEFAULT_FONT: FontKey = "outfit"

function font(key: FontKey): FontDef {
  return FONTS.find((f) => f.key === key) ?? FONTS[0]
}

export function fontCss(key: FontKey): string {
  return font(key).css
}

export function fontWeight(key: FontKey): number | undefined {
  return font(key).weight
}
