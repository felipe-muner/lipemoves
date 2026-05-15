/**
 * Canonical list of nationalities (demonym form) with their ISO 3166-1 alpha-2
 * country code. Curated for a yoga studio / wellness center — top ~80
 * nationalities seen in Asia/Europe/Americas. Add more as needed.
 *
 * Storing the demonym (e.g. "Brazilian") in the DB keeps the data readable;
 * the flag is derived at render time via the country code.
 */
export interface Nationality {
  name: string
  code: string // ISO 3166-1 alpha-2
}

export const NATIONALITIES: Nationality[] = [
  // Americas
  { name: "American", code: "US" },
  { name: "Argentinian", code: "AR" },
  { name: "Brazilian", code: "BR" },
  { name: "Canadian", code: "CA" },
  { name: "Chilean", code: "CL" },
  { name: "Colombian", code: "CO" },
  { name: "Mexican", code: "MX" },
  { name: "Peruvian", code: "PE" },
  { name: "Uruguayan", code: "UY" },
  { name: "Venezuelan", code: "VE" },

  // Europe
  { name: "Austrian", code: "AT" },
  { name: "Belgian", code: "BE" },
  { name: "British", code: "GB" },
  { name: "Bulgarian", code: "BG" },
  { name: "Croatian", code: "HR" },
  { name: "Czech", code: "CZ" },
  { name: "Danish", code: "DK" },
  { name: "Dutch", code: "NL" },
  { name: "English", code: "GB" },
  { name: "Estonian", code: "EE" },
  { name: "Finnish", code: "FI" },
  { name: "French", code: "FR" },
  { name: "German", code: "DE" },
  { name: "Greek", code: "GR" },
  { name: "Hungarian", code: "HU" },
  { name: "Icelandic", code: "IS" },
  { name: "Irish", code: "IE" },
  { name: "Italian", code: "IT" },
  { name: "Latvian", code: "LV" },
  { name: "Lithuanian", code: "LT" },
  { name: "Norwegian", code: "NO" },
  { name: "Polish", code: "PL" },
  { name: "Portuguese", code: "PT" },
  { name: "Romanian", code: "RO" },
  { name: "Russian", code: "RU" },
  { name: "Scottish", code: "GB" },
  { name: "Slovak", code: "SK" },
  { name: "Slovenian", code: "SI" },
  { name: "Spanish", code: "ES" },
  { name: "Swedish", code: "SE" },
  { name: "Swiss", code: "CH" },
  { name: "Turkish", code: "TR" },
  { name: "Ukrainian", code: "UA" },
  { name: "Welsh", code: "GB" },

  // Asia & Oceania
  { name: "Australian", code: "AU" },
  { name: "Balinese", code: "ID" },
  { name: "Bangladeshi", code: "BD" },
  { name: "Burmese", code: "MM" },
  { name: "Cambodian", code: "KH" },
  { name: "Chinese", code: "CN" },
  { name: "Filipino", code: "PH" },
  { name: "Hong Konger", code: "HK" },
  { name: "Indian", code: "IN" },
  { name: "Indonesian", code: "ID" },
  { name: "Iranian", code: "IR" },
  { name: "Israeli", code: "IL" },
  { name: "Japanese", code: "JP" },
  { name: "Kazakh", code: "KZ" },
  { name: "Korean", code: "KR" },
  { name: "Laotian", code: "LA" },
  { name: "Malaysian", code: "MY" },
  { name: "Mongolian", code: "MN" },
  { name: "Nepalese", code: "NP" },
  { name: "New Zealander", code: "NZ" },
  { name: "Pakistani", code: "PK" },
  { name: "Saudi", code: "SA" },
  { name: "Singaporean", code: "SG" },
  { name: "Sri Lankan", code: "LK" },
  { name: "Taiwanese", code: "TW" },
  { name: "Thai", code: "TH" },
  { name: "Vietnamese", code: "VN" },

  // Africa & Middle East
  { name: "Egyptian", code: "EG" },
  { name: "Emirati", code: "AE" },
  { name: "Ethiopian", code: "ET" },
  { name: "Kenyan", code: "KE" },
  { name: "Lebanese", code: "LB" },
  { name: "Moroccan", code: "MA" },
  { name: "Nigerian", code: "NG" },
  { name: "South African", code: "ZA" },
  { name: "Tunisian", code: "TN" },
]

/** Sorted alphabetically. */
export const NATIONALITIES_SORTED = [...NATIONALITIES].sort((a, b) =>
  a.name.localeCompare(b.name),
)
