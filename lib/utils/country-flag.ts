/**
 * Map a free-form nationality / country string to an ISO 3166-1 alpha-2 code.
 * Returns null when we can't confidently match — caller decides the fallback.
 */
const NATIONALITY_TO_CODE: Record<string, string> = {
  // Americas
  american: "US",
  usa: "US",
  us: "US",
  "united states": "US",
  brazilian: "BR",
  brasilian: "BR",
  brazil: "BR",
  brasil: "BR",
  canadian: "CA",
  canada: "CA",
  mexican: "MX",
  mexico: "MX",
  argentinian: "AR",
  argentine: "AR",
  argentina: "AR",
  chilean: "CL",
  chile: "CL",
  colombian: "CO",
  colombia: "CO",
  peruvian: "PE",
  peru: "PE",
  uruguayan: "UY",
  uruguay: "UY",
  venezuelan: "VE",
  venezuela: "VE",

  // Europe
  british: "GB",
  english: "GB",
  scottish: "GB",
  welsh: "GB",
  uk: "GB",
  "united kingdom": "GB",
  "great britain": "GB",
  irish: "IE",
  ireland: "IE",
  german: "DE",
  germany: "DE",
  deutsch: "DE",
  french: "FR",
  france: "FR",
  italian: "IT",
  italy: "IT",
  spanish: "ES",
  spain: "ES",
  portuguese: "PT",
  portugal: "PT",
  dutch: "NL",
  netherlands: "NL",
  holland: "NL",
  belgian: "BE",
  belgium: "BE",
  swiss: "CH",
  switzerland: "CH",
  austrian: "AT",
  austria: "AT",
  swedish: "SE",
  sweden: "SE",
  norwegian: "NO",
  norway: "NO",
  danish: "DK",
  denmark: "DK",
  finnish: "FI",
  finland: "FI",
  polish: "PL",
  poland: "PL",
  czech: "CZ",
  greek: "GR",
  greece: "GR",
  hungarian: "HU",
  hungary: "HU",
  romanian: "RO",
  romania: "RO",
  russian: "RU",
  russia: "RU",
  ukrainian: "UA",
  ukraine: "UA",
  turkish: "TR",
  turkey: "TR",

  // Asia / Oceania
  japanese: "JP",
  japan: "JP",
  chinese: "CN",
  china: "CN",
  korean: "KR",
  "south korean": "KR",
  "south korea": "KR",
  korea: "KR",
  thai: "TH",
  thailand: "TH",
  indian: "IN",
  india: "IN",
  vietnamese: "VN",
  vietnam: "VN",
  indonesian: "ID",
  indonesia: "ID",
  balinese: "ID",
  malaysian: "MY",
  malaysia: "MY",
  singaporean: "SG",
  singapore: "SG",
  filipino: "PH",
  philippines: "PH",
  australian: "AU",
  australia: "AU",
  "new zealander": "NZ",
  "new zealand": "NZ",
  kiwi: "NZ",
  israeli: "IL",
  israel: "IL",

  // Africa
  "south african": "ZA",
  "south africa": "ZA",
  egyptian: "EG",
  egypt: "EG",
  moroccan: "MA",
  morocco: "MA",
}

export function nationalityToCountryCode(
  input: string | null | undefined,
): string | null {
  if (!input) return null
  const key = input.trim().toLowerCase()
  if (!key) return null
  return NATIONALITY_TO_CODE[key] ?? null
}

/** Convert a 2-letter country code (ISO 3166-1 alpha-2) to its flag emoji. */
export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code) return ""
  const cc = code.trim().toUpperCase()
  if (cc.length !== 2 || !/^[A-Z]{2}$/.test(cc)) return ""
  // Regional indicator symbols sit at U+1F1E6 (= 'A').
  const base = 0x1f1e6
  return (
    String.fromCodePoint(base + (cc.charCodeAt(0) - 65)) +
    String.fromCodePoint(base + (cc.charCodeAt(1) - 65))
  )
}

/** Convenience: nationality string → flag emoji (empty when unknown). */
export function nationalityFlag(input: string | null | undefined): string {
  return countryCodeToFlag(nationalityToCountryCode(input))
}
