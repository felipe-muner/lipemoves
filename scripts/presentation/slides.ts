/**
 * Slide data shared by the TTS script generator and the Remotion
 * composition. Edit the narration here — durations are estimated from
 * word count and adjusted at render time using the actual audio length.
 */

export interface Slide {
  /** Slug used as the screenshot filename (without .png) and audio filename (without .aiff/.mp3) */
  id: string
  /** Section title shown in the slide */
  title: string
  /** Narration text — read aloud by `say` */
  narration: string
}

export const slides: Slide[] = [
  {
    id: "00-intro",
    title: "Lipe CRM",
    narration:
      "Welcome to Lipe CRM — a yoga studio management dashboard. Let me walk you through it.",
  },
  {
    id: "01-login",
    title: "Sign in",
    narration:
      "Users sign in with Google or a password. Teachers are auto-linked to their account on first login, so there is no manual setup needed.",
  },
  {
    id: "02-overview",
    title: "Overview",
    narration:
      "The overview shows revenue, classes, students, and active teachers at a glance, with a six-month activity chart underneath.",
  },
  {
    id: "03-classes-calendar",
    title: "Classes — Calendar view",
    narration:
      "Classes are managed in a weekly grid. Each class block shows the start time, end time, teacher, and price — color-coded by teacher.",
  },
  {
    id: "04-new-class-dialog",
    title: "Add a class",
    narration:
      "Click any empty cell on the calendar to create a class for that exact day and time. Set the name, teacher, price, and the teacher's share percentage — that share drives the payment report later.",
  },
  {
    id: "05-import-dialog",
    title: "Bulk import",
    narration:
      "Need to add many classes at once? Upload an Excel or CSV file. The system shows a preview of every row, then validates them and tells you exactly which lines succeeded — and why any failed.",
  },
  {
    id: "06-copy-week-dialog",
    title: "Copy week",
    narration:
      "If next week's schedule looks like this one, copy week duplicates every class to a target week — one click, and any slots that would conflict are automatically skipped.",
  },
  {
    id: "07-classes-list",
    title: "Classes — List view",
    narration:
      "Prefer a table? Switch to list view to see every class with date, time, teacher, price, and the teacher's share — sortable in one place.",
  },
  {
    id: "08-teachers",
    title: "Teachers",
    narration:
      "The Teachers page manages everyone who hosts a class — name, email, phone, passport for visa records, and active status.",
  },
  {
    id: "09-teacher-dialog",
    title: "Add a teacher",
    narration:
      "Adding a teacher is a single form. Use their Gmail address — when they sign in with Google for the first time, the system automatically links the accounts.",
  },
  {
    id: "10-students",
    title: "Students",
    narration:
      "Students are tracked across all classes — keyed by email, with optional passport, phone, and nationality, and a count of their memberships.",
  },
  {
    id: "11-payments",
    title: "Payments report",
    narration:
      "The payments report is computed dynamically. Pick a date range — the system pulls every class a teacher hosted in that window, multiplies price by share percent, and shows the total payout per teacher.",
  },
  {
    id: "12-account",
    title: "Account & preferences",
    narration:
      "Each user has their own account page with theme controls — light, dark, or system — and a currency switcher between Thai baht and US dollar, using a live exchange rate.",
  },
  {
    id: "13-outro",
    title: "That's Lipe CRM",
    narration:
      "Built with Next.js, Drizzle, and shadcn. Everything you just saw is open for you to manage your studio. Thanks for watching.",
  },
]
