import { db } from "@/lib/db"
import {
  users,
  employees,
  employeeRoles,
  employeeTeams,
  roles,
  teams,
  yogaClasses,
  students,
  studentMemberships,
  membershipPlans,
  classAttendance,
  locations,
  products,
  restaurantTables,
  stockMovements,
  sales,
  saleItems,
  expenses,
  expenseCategories,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import {
  addDays,
  addHours,
  formatISO,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfMonth,
  setHours,
  setMinutes,
  subMonths,
} from "date-fns"

const ADMIN_EMAIL = "felipe.muner@gmail.com"
const MANAGER_EMAIL = "kohphanganguide@gmail.com"

/**
 * Koh Phangan seasonal multipliers (1.0 = year average).
 * Sources: Tourist arrival data + Full Moon Party calendar + monsoon pattern.
 *   Dec/Jan/Feb peak (cool, dry, Christmas/NYE, Full Moon),
 *   Sep lowest (worst monsoon), May–Oct generally low,
 *   Jul–Aug mini-peak from Israeli/European summer holiday.
 */
const SEASONALITY: Record<number, number> = {
  0: 1.5,  // Jan
  1: 1.4,  // Feb
  2: 1.2,  // Mar
  3: 0.7,  // Apr (post-Songkran)
  4: 0.55, // May
  5: 0.6,  // Jun
  6: 0.85, // Jul (Euro summer)
  7: 0.9,  // Aug
  8: 0.4,  // Sep (peak monsoon)
  9: 0.55, // Oct
  10: 1.0, // Nov (building up)
  11: 1.6, // Dec (peak)
}
function seasonFactor(d: Date): number {
  return SEASONALITY[d.getMonth()] ?? 1
}

async function upsertUser(opts: {
  email: string
  name: string
  password?: string
  role: "admin" | "manager" | "teacher"
}) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, opts.email))
    .limit(1)
  const hashedPassword = opts.password
    ? await bcrypt.hash(opts.password, 10)
    : undefined
  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        name: opts.name,
        role: opts.role,
        ...(hashedPassword ? { hashedPassword } : {}),
      })
      .where(eq(users.id, existing.id))
      .returning()
    return updated
  }
  const [created] = await db
    .insert(users)
    .values({
      email: opts.email,
      name: opts.name,
      hashedPassword,
      emailVerified: new Date(),
      role: opts.role,
    })
    .returning()
  return created
}

interface TeacherSpec {
  slug: string
  name: string
  bio: string
  phone: string
  passport: string
}

const TEACHER_SPECS: TeacherSpec[] = [
  { slug: "anna",   name: "Anna Beck",        bio: "Vinyasa & Yin",        phone: "+66 80 111 2200", passport: "C01X11122" },
  { slug: "luca",   name: "Luca Rossi",       bio: "Ashtanga · Mysore",    phone: "+66 81 222 3300", passport: "YA8800123" },
  { slug: "putu",   name: "Putu Surya",       bio: "Hatha & Pranayama",    phone: "+66 90 444 5500", passport: "P9988776"  },
  { slug: "maya",   name: "Maya Singh",       bio: "Yin · Restorative",    phone: "+66 91 555 6600", passport: "K2030404"  },
  { slug: "david",  name: "David Klein",      bio: "Pranayama · Meditation", phone: "+66 92 666 7700", passport: "DE7732119"},
  { slug: "sofia",  name: "Sofia Reyes",      bio: "Kundalini · Mantra",   phone: "+66 93 777 8800", passport: "ES5544332" },
  { slug: "ravi",   name: "Ravi Patel",       bio: "Iyengar · Alignment",  phone: "+66 94 888 9900", passport: "IN2299181" },
  { slug: "lily",   name: "Lily Tan",         bio: "Hot Yoga · Endurance", phone: "+66 95 100 1100", passport: "SG6677889" },
  { slug: "marco",  name: "Marco Silva",      bio: "Acro · Partner work",  phone: "+66 96 200 1200", passport: "BR1122334" },
  { slug: "naomi",  name: "Naomi Tanaka",     bio: "Restorative · Nidra",  phone: "+66 97 300 1300", passport: "JP9988100" },
  { slug: "bruno",  name: "Bruno Costa",      bio: "Power Vinyasa",        phone: "+66 98 400 1400", passport: "BR2233445" },
  { slug: "elena",  name: "Elena Müller",     bio: "Yoga Nidra · Sound",   phone: "+66 99 500 1500", passport: "DE6655443" },
]

interface ScheduledClass {
  teacherSlug: string
  locationSlug: "main" | "open"
  name: string
  dayOffset: number // days from week start (Mon=0)
  hour: number
  duration: number // minutes
  priceThb: number
  sharePercent: number
}

// 21 regular classes across Mon-Sun in 2 locations
const REGULAR_CLASSES: ScheduledClass[] = [
  // MON
  { teacherSlug: "putu",  locationSlug: "main", name: "Hatha Morning",        dayOffset: 0, hour: 7,  duration: 75, priceThb: 300, sharePercent: 65 },
  { teacherSlug: "anna",  locationSlug: "open", name: "Vinyasa Flow",         dayOffset: 0, hour: 8,  duration: 75, priceThb: 350, sharePercent: 70 },
  { teacherSlug: "naomi", locationSlug: "main", name: "Restorative",          dayOffset: 0, hour: 18, duration: 90, priceThb: 350, sharePercent: 70 },
  // TUE
  { teacherSlug: "luca",  locationSlug: "main", name: "Ashtanga Mysore",      dayOffset: 1, hour: 7,  duration: 90, priceThb: 400, sharePercent: 75 },
  { teacherSlug: "ravi",  locationSlug: "open", name: "Iyengar Alignment",    dayOffset: 1, hour: 10, duration: 75, priceThb: 350, sharePercent: 70 },
  { teacherSlug: "maya",  locationSlug: "main", name: "Yin Restorative",      dayOffset: 1, hour: 17, duration: 90, priceThb: 350, sharePercent: 70 },
  // WED
  { teacherSlug: "anna",  locationSlug: "open", name: "Vinyasa Flow",         dayOffset: 2, hour: 7,  duration: 75, priceThb: 350, sharePercent: 70 },
  { teacherSlug: "bruno", locationSlug: "main", name: "Power Vinyasa",       dayOffset: 2, hour: 17, duration: 75, priceThb: 400, sharePercent: 70 },
  { teacherSlug: "david", locationSlug: "open", name: "Pranayama & Meditation", dayOffset: 2, hour: 18, duration: 60, priceThb: 250, sharePercent: 65 },
  // THU
  { teacherSlug: "putu",  locationSlug: "open", name: "Hatha Morning",        dayOffset: 3, hour: 7,  duration: 75, priceThb: 300, sharePercent: 65 },
  { teacherSlug: "lily",  locationSlug: "main", name: "Hot Yoga",             dayOffset: 3, hour: 17, duration: 60, priceThb: 400, sharePercent: 70 },
  { teacherSlug: "sofia", locationSlug: "open", name: "Kundalini Awakening",  dayOffset: 3, hour: 19, duration: 75, priceThb: 380, sharePercent: 70 },
  // FRI
  { teacherSlug: "luca",  locationSlug: "main", name: "Ashtanga Led",         dayOffset: 4, hour: 7,  duration: 90, priceThb: 400, sharePercent: 75 },
  { teacherSlug: "anna",  locationSlug: "open", name: "Sunset Vinyasa",       dayOffset: 4, hour: 18, duration: 75, priceThb: 350, sharePercent: 70 },
  { teacherSlug: "elena", locationSlug: "main", name: "Yoga Nidra",           dayOffset: 4, hour: 19, duration: 60, priceThb: 300, sharePercent: 65 },
  // SAT
  { teacherSlug: "marco", locationSlug: "main", name: "Acro Yoga",            dayOffset: 5, hour: 10, duration: 90, priceThb: 450, sharePercent: 70 },
  { teacherSlug: "bruno", locationSlug: "open", name: "Power Vinyasa",       dayOffset: 5, hour: 8,  duration: 75, priceThb: 400, sharePercent: 70 },
  { teacherSlug: "maya",  locationSlug: "main", name: "Yin & Restorative",    dayOffset: 5, hour: 17, duration: 90, priceThb: 350, sharePercent: 70 },
  // SUN
  { teacherSlug: "naomi", locationSlug: "open", name: "Sunday Restorative",   dayOffset: 6, hour: 9,  duration: 90, priceThb: 350, sharePercent: 70 },
  { teacherSlug: "sofia", locationSlug: "main", name: "Mantra & Meditation",  dayOffset: 6, hour: 18, duration: 75, priceThb: 320, sharePercent: 65 },
  { teacherSlug: "elena", locationSlug: "open", name: "Sunday Yoga Nidra",    dayOffset: 6, hour: 19, duration: 60, priceThb: 300, sharePercent: 65 },
]

// 28 workshops — each teacher hosts 2-3 workshops, distributed over next 4 weeks
interface WorkshopSpec {
  teacherSlug: string
  locationSlug: "main" | "open"
  name: string
  daysFromNow: number
  hour: number
  duration: number // minutes (workshops are longer)
  priceThb: number
  sharePercent: number
}

const WORKSHOPS: WorkshopSpec[] = [
  { teacherSlug: "anna",  locationSlug: "main", name: "Vinyasa Immersion Weekend",        daysFromNow: 2,  hour: 14, duration: 240, priceThb: 1500, sharePercent: 60 },
  { teacherSlug: "anna",  locationSlug: "main", name: "Sequencing Workshop for Teachers", daysFromNow: 9,  hour: 14, duration: 180, priceThb: 1200, sharePercent: 60 },
  { teacherSlug: "anna",  locationSlug: "open", name: "Hands-On Adjustments",             daysFromNow: 16, hour: 14, duration: 180, priceThb: 1200, sharePercent: 60 },

  { teacherSlug: "luca",  locationSlug: "main", name: "Ashtanga Mysore Intensive",        daysFromNow: 3,  hour: 6,  duration: 180, priceThb: 1800, sharePercent: 70 },
  { teacherSlug: "luca",  locationSlug: "main", name: "Sun A & Sun B Deep Dive",          daysFromNow: 10, hour: 6,  duration: 150, priceThb: 1200, sharePercent: 65 },
  { teacherSlug: "luca",  locationSlug: "open", name: "Trauma-Informed Yoga",             daysFromNow: 22, hour: 15, duration: 210, priceThb: 1400, sharePercent: 60 },

  { teacherSlug: "putu",  locationSlug: "open", name: "Pranayama Deep Dive",              daysFromNow: 5,  hour: 14, duration: 180, priceThb: 1000, sharePercent: 60 },
  { teacherSlug: "putu",  locationSlug: "main", name: "Breathwork & Cold Plunge",         daysFromNow: 12, hour: 8,  duration: 180, priceThb: 1400, sharePercent: 60 },

  { teacherSlug: "maya",  locationSlug: "open", name: "Hip Opening Masterclass",          daysFromNow: 4,  hour: 14, duration: 180, priceThb: 1100, sharePercent: 65 },
  { teacherSlug: "maya",  locationSlug: "main", name: "Yin & Restorative Sunday",         daysFromNow: 11, hour: 15, duration: 240, priceThb: 1300, sharePercent: 65 },

  { teacherSlug: "david", locationSlug: "main", name: "Meditation Retreat Day",           daysFromNow: 6,  hour: 9,  duration: 360, priceThb: 2200, sharePercent: 60 },
  { teacherSlug: "david", locationSlug: "open", name: "Mindful Movement",                 daysFromNow: 17, hour: 16, duration: 150, priceThb: 950,  sharePercent: 60 },

  { teacherSlug: "sofia", locationSlug: "main", name: "Kundalini Awakening Day",          daysFromNow: 8,  hour: 10, duration: 240, priceThb: 1500, sharePercent: 65 },
  { teacherSlug: "sofia", locationSlug: "open", name: "Mantra Singing Circle",            daysFromNow: 15, hour: 19, duration: 120, priceThb: 700,  sharePercent: 60 },

  { teacherSlug: "ravi",  locationSlug: "main", name: "Iyengar Foundations",              daysFromNow: 7,  hour: 14, duration: 180, priceThb: 1200, sharePercent: 65 },
  { teacherSlug: "ravi",  locationSlug: "open", name: "Anatomy for Teachers",             daysFromNow: 18, hour: 14, duration: 210, priceThb: 1400, sharePercent: 65 },

  { teacherSlug: "lily",  locationSlug: "main", name: "Hot Yoga Endurance",               daysFromNow: 9,  hour: 17, duration: 120, priceThb: 800,  sharePercent: 65 },
  { teacherSlug: "lily",  locationSlug: "main", name: "Yoga for Athletes",                daysFromNow: 20, hour: 16, duration: 150, priceThb: 1000, sharePercent: 65 },

  { teacherSlug: "marco", locationSlug: "main", name: "Acro Partners Workshop",           daysFromNow: 6,  hour: 14, duration: 180, priceThb: 1200, sharePercent: 65 },
  { teacherSlug: "marco", locationSlug: "main", name: "Inversion Lab",                    daysFromNow: 13, hour: 15, duration: 180, priceThb: 1200, sharePercent: 65 },
  { teacherSlug: "marco", locationSlug: "open", name: "Backbend Workshop",                daysFromNow: 21, hour: 14, duration: 180, priceThb: 1200, sharePercent: 65 },

  { teacherSlug: "naomi", locationSlug: "open", name: "Yoga Nidra Sleep Lab",             daysFromNow: 10, hour: 19, duration: 120, priceThb: 700,  sharePercent: 60 },
  { teacherSlug: "naomi", locationSlug: "main", name: "Women's Circle",                   daysFromNow: 19, hour: 18, duration: 150, priceThb: 850,  sharePercent: 60 },

  { teacherSlug: "bruno", locationSlug: "main", name: "Power Vinyasa Bootcamp",           daysFromNow: 11, hour: 7,  duration: 150, priceThb: 1000, sharePercent: 70 },
  { teacherSlug: "bruno", locationSlug: "open", name: "Men's Yoga Strength",              daysFromNow: 23, hour: 8,  duration: 120, priceThb: 850,  sharePercent: 65 },

  { teacherSlug: "elena", locationSlug: "open", name: "Sound Bath Journey",               daysFromNow: 12, hour: 19, duration: 90,  priceThb: 600,  sharePercent: 55 },
  { teacherSlug: "elena", locationSlug: "main", name: "Yoga & Surf Day",                  daysFromNow: 24, hour: 7,  duration: 360, priceThb: 2500, sharePercent: 50 },
  { teacherSlug: "elena", locationSlug: "open", name: "Full Moon Yin Practice",           daysFromNow: 25, hour: 20, duration: 120, priceThb: 700,  sharePercent: 60 },
]

export async function seedCrm() {
  console.log("→ Cleaning previous CRM data...")
  await db.delete(saleItems)
  await db.delete(sales)
  await db.delete(stockMovements)
  await db.delete(products)
  await db.delete(restaurantTables)
  await db.delete(classAttendance)
  await db.delete(studentMemberships)
  await db.delete(membershipPlans)
  await db.delete(expenses)
  await db.delete(expenseCategories)
  await db.delete(yogaClasses)
  await db.delete(employees)
  await db.delete(students)
  await db.delete(locations)

  console.log("→ Locations (2 shalas)...")
  const [shalaMain, shalaOpen] = await db
    .insert(locations)
    .values([
      { name: "Main Shala", color: "#fbbf24", isDefault: true },
      { name: "Open Sala",  color: "#38bdf8" },
    ])
    .returning()
  const locMap = { main: shalaMain.id, open: shalaOpen.id }

  console.log("→ Promoting admin + manager...")
  await upsertUser({ email: ADMIN_EMAIL,   name: "Felipe Muner",         password: "test123", role: "admin"   })
  await upsertUser({ email: MANAGER_EMAIL, name: "Manager Koh Phangan",  password: "test123", role: "manager" })

  console.log(`→ Creating ${TEACHER_SPECS.length} teacher users...`)
  const teacherUsers = await Promise.all(
    TEACHER_SPECS.map((t) =>
      upsertUser({
        email: `${t.slug}@phanganyoga.com`,
        name: t.name,
        password: "test123",
        role: "teacher",
      }),
    ),
  )

  console.log(`→ Creating ${TEACHER_SPECS.length} employee records...`)
  const employeeRows = await db
    .insert(employees)
    .values(
      TEACHER_SPECS.map((t, i) => ({
        userId: teacherUsers[i].id,
        name: t.name,
        email: `${t.slug}@phanganyoga.com`,
        phone: t.phone,
        passport: t.passport,
        bio: t.bio,
      })),
    )
    .returning()
  const teacherBySlug = new Map(
    TEACHER_SPECS.map((t, i) => [t.slug, employeeRows[i]]),
  )

  console.log("→ Ensuring default roles + teams...")
  await db
    .insert(roles)
    .values([
      { name: "Teacher", slug: "teacher", color: "#a855f7", isSystem: true },
      { name: "Manager", slug: "manager", color: "#0ea5e9", isSystem: true },
      { name: "Waiter", slug: "waiter", color: "#f59e0b", isSystem: true },
      { name: "Cleaner", slug: "cleaner", color: "#64748b", isSystem: true },
    ])
    .onConflictDoNothing({ target: roles.slug })
  await db
    .insert(teams)
    .values([
      { name: "Yoga", slug: "yoga", color: "#a855f7" },
      { name: "Restaurant", slug: "restaurant", color: "#f59e0b" },
    ])
    .onConflictDoNothing({ target: teams.slug })

  console.log("→ Assigning teacher role + yoga team...")
  const [teacherRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, "teacher"))
  const [yogaTeam] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.slug, "yoga"))
  if (teacherRole && yogaTeam) {
    await db.insert(employeeRoles).values(
      employeeRows.map((e) => ({
        employeeId: e.id,
        roleId: teacherRole.id,
      })),
    )
    await db.insert(employeeTeams).values(
      employeeRows.map((e) => ({
        employeeId: e.id,
        teamId: yogaTeam.id,
      })),
    )
  }

  console.log(
    `→ Regular classes (52 weeks of history) — ${REGULAR_CLASSES.length * 52} classes...`,
  )
  // 12 months of weekly history so finance / payments / attendance reflect
  // Koh Phangan seasonality across a full year.
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekOffsets = Array.from({ length: 52 }, (_, i) => i - 51) // -51..0
  const classRows = await db
    .insert(yogaClasses)
    .values(
      weekOffsets.flatMap((wOff) =>
        REGULAR_CLASSES.map((c) => {
          const t = teacherBySlug.get(c.teacherSlug)
          if (!t) throw new Error(`Teacher slug ${c.teacherSlug} not found`)
          const dayShifted = addDays(weekStart, c.dayOffset + wOff * 7)
          const scheduledAt = formatISO(
            setMinutes(setHours(dayShifted, c.hour), 0),
          )
          return {
            name: c.name,
            employeeId: t.id,
            locationId: locMap[c.locationSlug],
            scheduledAt,
            durationMinutes: c.duration,
            priceThb: c.priceThb,
            teacherSharePercent: c.sharePercent,
            capacity: 20,
          }
        }),
      ),
    )
    .returning()

  console.log(`→ Workshops (12 months, seasonal density)...`)
  const now = new Date()
  // Distribute workshops weekly across the 52-week window: more in high season,
  // fewer in low season. Each week we sample n workshops from the template list.
  const workshopValues: Array<{
    name: string
    employeeId: string
    locationId: string
    scheduledAt: string
    durationMinutes: number
    priceThb: number
    teacherSharePercent: number
    capacity: number
  }> = []
  for (const wOff of weekOffsets) {
    const weekMidpoint = addDays(weekStart, wOff * 7 + 3)
    const factor = seasonFactor(weekMidpoint)
    // ~ factor * 2 workshops/week, jittered. High season => ~3, low => ~1.
    const target = Math.max(
      0,
      Math.round(factor * 2.2 + (Math.random() - 0.5)),
    )
    const picks = WORKSHOPS.slice().sort(() => Math.random() - 0.5).slice(0, target)
    for (let i = 0; i < picks.length; i++) {
      const w = picks[i]
      const t = teacherBySlug.get(w.teacherSlug)
      if (!t) continue
      // Spread within the week: each workshop on a different day.
      const day = addDays(weekStart, wOff * 7 + ((i + 2) % 7))
      const scheduledAt = formatISO(setMinutes(setHours(day, w.hour), 0))
      workshopValues.push({
        name: w.name,
        employeeId: t.id,
        locationId: locMap[w.locationSlug],
        scheduledAt,
        durationMinutes: w.duration,
        priceThb: w.priceThb,
        teacherSharePercent: w.sharePercent,
        capacity: 30,
      })
    }
  }
  const workshopRows =
    workshopValues.length > 0
      ? await db.insert(yogaClasses).values(workshopValues).returning()
      : []

  console.log("→ Students (6 named + 74 international pool = 80 total)...")
  const NAMED_STUDENTS = [
    { email: "lena.mueller@example.com",   name: "Lena Müller",       passport: "C01X45678", phone: "+49 151 22334455", nationality: "German"     },
    { email: "sophie.dubois@example.com",  name: "Sophie Dubois",     passport: "20FR98765", phone: "+33 6 12 34 56 78", nationality: "French"    },
    { email: "james.oconnor@example.com",  name: "James O'Connor",    passport: "P99887766", phone: "+1 415 555 0199",  nationality: "American"  },
    { email: "yuki.tanaka@example.com",    name: "Yuki Tanaka",       passport: "TR1234567", phone: "+81 90 1234 5678", nationality: "Japanese"  },
    { email: "ana.costa@example.com",      name: "Ana Costa",         passport: "BR998877",  phone: "+55 11 99876 5432", nationality: "Brazilian" },
    { email: "tom.harris@example.com",     name: "Tom Harris",        passport: "GB1029384", phone: "+44 7700 900123",  nationality: "British"   },
  ]

  // International pool — weighted toward Koh Phangan's actual demographics
  // (lots of Israelis, Germans, French, British, Russians, plus Americans,
  // Australians, Italians, Brazilians, Japanese, etc.)
  const FIRSTS = [
    "Noa", "Tal", "Yael", "Eden", "Ori", "Liron", "Maya", "Itai", "Daniel", "Roy",
    "Hannah", "Klaus", "Sven", "Lukas", "Mia", "Lara", "Felix", "Greta", "Jonas",
    "Camille", "Léa", "Hugo", "Margot", "Antoine", "Élise", "Théo",
    "Oliver", "Emma", "Charlotte", "Jack", "Sophie", "Harry", "Ava", "George",
    "Dmitry", "Anastasia", "Ivan", "Olga", "Sergey", "Natasha",
    "Luca", "Giulia", "Matteo", "Chiara", "Lorenzo", "Alessia",
    "Pedro", "Carla", "Bruno", "Fernanda", "Rafael", "Mariana",
    "Kenji", "Hina", "Ren", "Aoi",
    "Liam", "Ethan", "Olivia", "Madison",
    "Lachlan", "Hayley", "Isla", "Riley",
    "Indra", "Putri", "Ari", "Made",
  ]
  const LASTS = [
    "Cohen", "Levi", "Friedman", "Mizrahi", "Shapira",
    "Schmidt", "Weber", "Bauer", "Hoffmann", "Wagner",
    "Martin", "Bernard", "Lefebvre", "Roux", "Moreau",
    "Smith", "Brown", "Taylor", "Walker", "Hughes",
    "Ivanov", "Petrov", "Sokolov", "Volkov",
    "Rossi", "Conti", "Esposito", "Greco",
    "Silva", "Souza", "Lima", "Pereira",
    "Tanaka", "Sato", "Yamada", "Suzuki",
    "Garcia", "Hernandez", "Lopez", "Martinez",
    "Nguyen", "Tran", "Pham",
    "O'Brien", "MacKenzie",
  ]
  const NATS = [
    "Israeli","Israeli","Israeli","Israeli", // heavy weight — big demographic on Phangan
    "German","German","German",
    "French","French",
    "British","British",
    "Russian","Russian",
    "Italian",
    "American","American",
    "Australian",
    "Brazilian",
    "Japanese",
    "Spanish",
    "Swedish",
    "Norwegian",
    "Dutch",
    "Indonesian",
  ]
  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }
  const poolStudents: typeof NAMED_STUDENTS = []
  const usedEmails = new Set(NAMED_STUDENTS.map((s) => s.email))
  for (let i = 0; poolStudents.length < 74 && i < 500; i++) {
    const first = pick(FIRSTS)
    const last = pick(LASTS)
    const email = `${first.toLowerCase().replace(/[^a-z]/g, "")}.${last.toLowerCase().replace(/[^a-z]/g, "")}${i}@example.com`
    if (usedEmails.has(email)) continue
    usedEmails.add(email)
    poolStudents.push({
      email,
      name: `${first} ${last}`,
      passport: null as unknown as string,
      phone: null as unknown as string,
      nationality: pick(NATS),
    })
  }
  await db.insert(students).values([...NAMED_STUDENTS, ...poolStudents])
  const allStudentEmails = [
    ...NAMED_STUDENTS.map((s) => s.email),
    ...poolStudents.map((s) => s.email),
  ]

  console.log("→ Membership plans (Yoga / Pool / Ice Bath)...")
  const planRows = await db
    .insert(membershipPlans)
    .values([
      // YOGA — purple, light → dark
      { name: "Yoga — Drop In Class",             slug: "yoga_drop_in",         type: "drop_in",    durationDays: 1,  classesIncluded: 1,    priceThb: 450,  color: "#c084fc", description: "Single yoga class",                              sortOrder: 10 },
      { name: "Yoga — 5 Classes Pass",            slug: "yoga_5_classes",       type: "class_pack", durationDays: 60, classesIncluded: 5,    priceThb: 2000, color: "#a855f7", description: "5 yoga classes",                                  sortOrder: 11 },
      { name: "Yoga — 10 Classes Pass",           slug: "yoga_10_classes",      type: "class_pack", durationDays: 90, classesIncluded: 10,   priceThb: 3500, color: "#9333ea", description: "10 yoga classes",                                 sortOrder: 12 },
      { name: "Yoga — 30 Days Unlimited",         slug: "yoga_30_unlimited",    type: "monthly",    durationDays: 30, classesIncluded: null, priceThb: 5000, color: "#7e22ce", description: "Three time slots/day, 30 days",                   sortOrder: 13 },

      // POOL — saturated royal blue, light → dark
      { name: "Pool — Daily Pass · Package 1",    slug: "pool_daily_p1",        type: "drop_in",    durationDays: 1,  classesIncluded: 1,    priceThb: 599,  color: "#3b82f6", description: "Daily pool pass (Package 1) · 10:30 – 19:30",      sortOrder: 20 },
      { name: "Pool — Daily Pass · Package 2",    slug: "pool_daily_p2",        type: "drop_in",    durationDays: 1,  classesIncluded: 1,    priceThb: 999,  color: "#1d4ed8", description: "Daily pool pass (Package 2) · 10:30 – 19:30",      sortOrder: 21 },

      // ICE BATH — icy / frost teal, light → dark
      { name: "Ice Bath — Daily Pass",            slug: "ice_daily",            type: "drop_in",    durationDays: 1,  classesIncluded: 1,    priceThb: 200,  color: "#a5f3fc", description: "Single ice bath session",                          sortOrder: 30 },
      { name: "Ice Bath — 5 Sessions Pass",       slug: "ice_5_sessions",       type: "class_pack", durationDays: 60, classesIncluded: 5,    priceThb: 900,  color: "#22d3ee", description: "5 ice bath sessions",                              sortOrder: 31 },
      { name: "Ice Bath — 10 Sessions Pass",      slug: "ice_10_sessions",      type: "class_pack", durationDays: 90, classesIncluded: 10,   priceThb: 1500, color: "#0e9aa7", description: "10 ice bath sessions",                             sortOrder: 32 },
      { name: "Ice Bath — 30 Days Unlimited",     slug: "ice_30_unlimited",     type: "monthly",    durationDays: 30, classesIncluded: null, priceThb: 2205, color: "#115e59", description: "Unlimited 30 days · Infrared Sauna & Herbal Steam", sortOrder: 33 },
    ])
    .returning()
  const planBySlug = new Map(planRows.map((p) => [p.slug, p]))

  console.log("→ Memberships (12 months, seasonal — high season = many monthly passes)...")
  // Per month: ~ 28 * factor purchases distributed across all students.
  // Plan distribution: high-season favors drop-ins / day passes (tourists),
  // low-season favors longer commitments (residents stay).
  const planList = planRows
  const dropInPlans = planList.filter((p) => p.type === "drop_in")
  const packPlans = planList.filter((p) => p.type === "class_pack")
  const monthlyPlans = planList.filter((p) => p.type === "monthly")

  function pickPlan(factor: number) {
    // High season => 60% drop-in, 25% pack, 15% monthly.
    // Low season  => 25% drop-in, 35% pack, 40% monthly.
    const r = Math.random()
    if (factor > 1) {
      if (r < 0.6) return pick(dropInPlans)
      if (r < 0.85) return pick(packPlans)
      return pick(monthlyPlans)
    }
    if (r < 0.25) return pick(dropInPlans)
    if (r < 0.6) return pick(packPlans)
    return pick(monthlyPlans)
  }

  const membershipValues: Array<{
    studentEmail: string
    planId: string
    type: "drop_in" | "monthly" | "class_pack" | "free_pass" | "custom"
    startsOn: string
    endsOn: string | null
    classesRemaining: number | null
    pricePaidThb: number
  }> = []
  for (let monthsAgo = 0; monthsAgo <= 12; monthsAgo++) {
    const ref = subMonths(now, monthsAgo)
    const factor = seasonFactor(ref)
    const count = Math.max(0, Math.round(28 * factor + (Math.random() - 0.5) * 6))
    for (let i = 0; i < count; i++) {
      const plan = pickPlan(factor)
      const dayOfMonth = 1 + Math.floor(Math.random() * 27)
      const startsOn = formatISO(
        new Date(ref.getFullYear(), ref.getMonth(), dayOfMonth, 10, 0, 0),
      )
      const endsOn = plan.durationDays
        ? formatISO(addDays(parseISO(startsOn), plan.durationDays))
        : null
      const buyer = pick(allStudentEmails)
      membershipValues.push({
        studentEmail: buyer,
        planId: plan.id,
        type: plan.type,
        startsOn,
        endsOn,
        classesRemaining: plan.classesIncluded,
        pricePaidThb: plan.priceThb,
      })
    }
  }
  if (membershipValues.length > 0) {
    const BATCH = 500
    for (let i = 0; i < membershipValues.length; i += BATCH) {
      await db
        .insert(studentMemberships)
        .values(membershipValues.slice(i, i + BATCH))
    }
  }

  console.log("→ Class attendance (seasonal: high season 8–14, low season 1–4)...")
  function shuffled<T>(arr: T[]): T[] {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }
  const attendanceRows: Array<{
    classId: string
    studentEmail: string
    checkedInAt: string
    pricePaidThb: number
    paymentMethod: "cash" | "card" | "transfer" | "other" | null
  }> = []
  const everyClass = [...classRows, ...workshopRows]
  for (const c of everyClass) {
    const when = new Date(c.scheduledAt)
    const isPast = when < now
    const factor = seasonFactor(when)
    // Base attendance = 7, scaled by seasonality, jittered. Future classes
    // are dampened (people book closer to date). Cap by capacity.
    const base = isPast ? 7 : 3
    const target = Math.max(
      0,
      Math.min(
        c.capacity ?? 20,
        Math.round(base * factor + (Math.random() - 0.5) * 4),
      ),
    )
    const picks = shuffled(allStudentEmails).slice(0, target)
    for (const email of picks) {
      // Drop-in share is higher in high season (tourists pay cash).
      const dropInChance = 0.2 + factor * 0.15
      const isDropIn = Math.random() < dropInChance
      attendanceRows.push({
        classId: c.id,
        studentEmail: email,
        checkedInAt: formatISO(addHours(when, 0)),
        pricePaidThb: isDropIn ? c.priceThb : 0,
        paymentMethod: isDropIn ? "cash" : null,
      })
    }
  }
  if (attendanceRows.length > 0) {
    // Batch inserts to keep individual statements reasonable.
    const BATCH = 1000
    for (let i = 0; i < attendanceRows.length; i += BATCH) {
      await db.insert(classAttendance).values(attendanceRows.slice(i, i + BATCH))
    }
  }

  console.log("→ Restaurant tables...")
  await db.insert(restaurantTables).values([
    { tableNumber: "T1", room: "Terrace", seats: 4 },
    { tableNumber: "T2", room: "Terrace", seats: 4 },
    { tableNumber: "T3", room: "Terrace", seats: 2 },
    { tableNumber: "B1", room: "Bar",     seats: 1 },
    { tableNumber: "B2", room: "Bar",     seats: 1 },
    { tableNumber: "R1", room: "Room",    seats: 8 },
  ])

  console.log("→ Products...")
  const productRows = await db
    .insert(products)
    .values([
      { name: "Whey Protein Shake",  sku: "SHK-WHEY", category: "supplement", baseUnit: "g",     stockQty: 1000, servingSize: 30, priceThb: 180 },
      { name: "Fresh Coconut",       sku: "DRK-COCO", category: "drink",      baseUnit: "piece", stockQty: 24,   servingSize: 1,  priceThb: 90  },
      { name: "Açaí Bowl",           sku: "FD-ACAI",  category: "food",       baseUnit: "piece", stockQty: 12,   servingSize: 1,  priceThb: 220 },
      { name: "Kombucha 330ml",      sku: "DRK-KMB",  category: "drink",      baseUnit: "ml",    stockQty: 9900, servingSize: 330, priceThb: 120 },
      { name: "Avocado Toast",       sku: "FD-AVO",   category: "food",       baseUnit: "piece", stockQty: 15,   servingSize: 1,  priceThb: 180 },
      { name: "Yoga Mat",            sku: "RT-MAT",   category: "retail",     baseUnit: "piece", stockQty: 8,    servingSize: 1,  priceThb: 1500 },
    ])
    .returning()

  console.log("→ Sample waiter (Som)...")
  const [waiterRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, "waiter"))
  const [restaurantTeam] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.slug, "restaurant"))
  const waiterUser = await upsertUser({
    email: "som@phanganyoga.com",
    name: "Som",
    password: "test123",
    role: "manager",
  })
  const [waiterEmp] = await db
    .insert(employees)
    .values({
      userId: waiterUser.id,
      name: "Som",
      email: "som@phanganyoga.com",
      phone: "+66 81 555 1234",
      bio: "Front-of-house lead",
    })
    .returning()
  if (waiterRole && restaurantTeam) {
    await db.insert(employeeRoles).values({
      employeeId: waiterEmp.id,
      roleId: waiterRole.id,
    })
    await db.insert(employeeTeams).values({
      employeeId: waiterEmp.id,
      teamId: restaurantTeam.id,
    })
  }

  console.log("→ Restaurant sales (12 months, seasonal)...")
  // Daily sales count scales with season. Year average ~4/day; high season ~7;
  // low season ~2. Each sale has 1–4 items from the product catalog.
  const salesValues: Array<{
    employeeId: string
    status: "paid"
    subtotalThb: number
    totalThb: number
    paymentMethod: "cash" | "card" | "transfer" | "other"
    paidAt: string
    openedAt: string
  }> = []
  const saleItemsBlueprint: Array<{
    saleIndex: number
    productId: string
    productName: string
    quantity: number
    unitPriceThb: number
    totalThb: number
  }> = []
  for (let daysAgo = 365; daysAgo >= 0; daysAgo--) {
    const day = addDays(now, -daysAgo)
    const factor = seasonFactor(day)
    const count = Math.max(
      0,
      Math.round(4 * factor + (Math.random() - 0.5) * 2),
    )
    for (let i = 0; i < count; i++) {
      const itemCount = 1 + Math.floor(Math.random() * 3)
      let subtotal = 0
      const items: typeof saleItemsBlueprint = []
      for (let j = 0; j < itemCount; j++) {
        const p = pick(productRows)
        const qty = 1 + Math.floor(Math.random() * 2)
        const line = p.priceThb * qty
        subtotal += line
        items.push({
          saleIndex: salesValues.length,
          productId: p.id,
          productName: p.name,
          quantity: qty,
          unitPriceThb: p.priceThb,
          totalThb: line,
        })
      }
      const hour = 9 + Math.floor(Math.random() * 12)
      const paidAt = formatISO(setMinutes(setHours(day, hour), 0))
      const method = pick(["cash", "card", "transfer"] as const)
      salesValues.push({
        employeeId: waiterEmp.id,
        status: "paid",
        subtotalThb: subtotal,
        totalThb: subtotal,
        paymentMethod: method,
        paidAt,
        openedAt: paidAt,
      })
      saleItemsBlueprint.push(...items)
    }
  }
  if (salesValues.length > 0) {
    const BATCH = 500
    const insertedSales: Array<{ id: string }> = []
    for (let i = 0; i < salesValues.length; i += BATCH) {
      const rows = await db
        .insert(sales)
        .values(salesValues.slice(i, i + BATCH))
        .returning({ id: sales.id })
      insertedSales.push(...rows)
    }
    const itemRows = saleItemsBlueprint.map((b) => ({
      saleId: insertedSales[b.saleIndex].id,
      productId: b.productId,
      productName: b.productName,
      quantity: b.quantity,
      unitPriceThb: b.unitPriceThb,
      totalThb: b.totalThb,
    }))
    for (let i = 0; i < itemRows.length; i += BATCH) {
      await db.insert(saleItems).values(itemRows.slice(i, i + BATCH))
    }
  }

  console.log("→ Expense categories (8 defaults)...")
  const CATS: Array<{
    name: string
    slug: string
    color: string
    description: string
    sortOrder: number
  }> = [
    { name: "Rent", slug: "rent", color: "#0ea5e9", description: "Studio rent", sortOrder: 10 },
    { name: "Utilities", slug: "utilities", color: "#22c55e", description: "Electricity, water, internet", sortOrder: 20 },
    { name: "Salaries (non-teacher)", slug: "salary", color: "#a855f7", description: "Managers, cleaners, waiters", sortOrder: 30 },
    { name: "Marketing", slug: "marketing", color: "#ec4899", description: "Ads, promotions, social", sortOrder: 40 },
    { name: "Supplies", slug: "supplies", color: "#f59e0b", description: "Inventory, mats, ingredients", sortOrder: 50 },
    { name: "Maintenance", slug: "maintenance", color: "#ef4444", description: "Repairs, plumber, equipment", sortOrder: 60 },
    { name: "Taxes & fees", slug: "taxes_fees", color: "#64748b", description: "Government, banking, transaction fees", sortOrder: 70 },
    { name: "Other", slug: "other", color: "#475569", description: "Catch-all", sortOrder: 99 },
  ]
  await db
    .insert(expenseCategories)
    .values(CATS.map((c) => ({ ...c, isSystem: true })))
    .onConflictDoNothing({ target: expenseCategories.slug })
  const catRows = await db
    .select({ id: expenseCategories.id, slug: expenseCategories.slug })
    .from(expenseCategories)
  const catBySlug = new Map(catRows.map((c) => [c.slug, c.id]))

  console.log("→ Expenses (12 months: fixed costs + seasonal marketing/supplies)...")
  const nowExp = new Date()
  type ExpSpec = {
    slug: string
    amountThb: number
    vendor: string | null
    description: string
    employee?: typeof waiterEmp | null
  }
  const expenseValues: Array<{
    categoryId: string
    amountThb: number
    incurredOn: string
    vendor: string | null
    description: string
    employeeId: string | null
    paymentMethod: "transfer"
    paidAt: string | null
  }> = []
  for (let monthsAgo = 0; monthsAgo <= 12; monthsAgo++) {
    const ref = subMonths(nowExp, monthsAgo)
    const factor = seasonFactor(ref)
    const monthly: ExpSpec[] = [
      { slug: "rent",      amountThb: 25000,                                vendor: "Landlord",  description: "Monthly studio rent" },
      { slug: "utilities", amountThb: Math.round(3800 + factor * 1200),     vendor: "PEA",       description: "Electricity bill" },
      { slug: "utilities", amountThb: Math.round(800 + factor * 300),       vendor: "PWA",       description: "Water bill" },
      { slug: "utilities", amountThb: 1490,                                 vendor: "AIS Fibre", description: "Internet" },
      { slug: "supplies",  amountThb: Math.round(2200 + factor * 2500),     vendor: "Makro",     description: "Restaurant ingredients" },
      { slug: "marketing", amountThb: Math.round(1500 + (1.2 - factor) * 2500), vendor: "Meta",  description: "Instagram / Facebook ads" },
      { slug: "salary",    amountThb: 18000,                                vendor: null,        description: "Monthly salary", employee: waiterEmp },
    ]
    // Occasional one-off expenses
    if (Math.random() < 0.5) {
      monthly.push({ slug: "maintenance", amountThb: 800 + Math.floor(Math.random() * 2200), vendor: "Handyman", description: "Repairs / maintenance" })
    }
    if (monthsAgo % 3 === 0) {
      monthly.push({ slug: "taxes_fees", amountThb: 1100 + Math.floor(Math.random() * 600), vendor: "Bank", description: "Card processing fees" })
    }
    if (factor > 1 && Math.random() < 0.5) {
      // Higher restock in high season
      monthly.push({ slug: "supplies", amountThb: 1500 + Math.floor(Math.random() * 1500), vendor: "Yoga Wares", description: "New mats / towels" })
    }

    for (const e of monthly) {
      const categoryId = catBySlug.get(e.slug)
      if (!categoryId) continue
      const day = 1 + Math.floor(Math.random() * 27)
      const incurredOn = formatISO(new Date(ref.getFullYear(), ref.getMonth(), day, 10, 0, 0))
      // Current-month expenses sometimes unpaid; everything older is paid.
      const paid = monthsAgo > 0 || Math.random() > 0.3
      expenseValues.push({
        categoryId,
        amountThb: e.amountThb,
        incurredOn,
        vendor: e.vendor,
        description: e.description,
        employeeId: e.employee?.id ?? null,
        paymentMethod: "transfer",
        paidAt: paid ? incurredOn : null,
      })
    }
  }
  if (expenseValues.length > 0) {
    const BATCH = 200
    for (let i = 0; i < expenseValues.length; i += BATCH) {
      await db.insert(expenses).values(expenseValues.slice(i, i + BATCH))
    }
  }

  console.log("→ Marking some past teacher classes as paid (cash-basis payouts)...")
  // Pull every class that already happened and randomly mark ~half paid in
  // each of the last 2 months so /finance has payout data to visualize.
  const pastClasses = await db.select({ id: yogaClasses.id, scheduledAt: yogaClasses.scheduledAt }).from(yogaClasses)
  const cutoff = nowExp
  for (const c of pastClasses) {
    const when = new Date(c.scheduledAt)
    if (when >= cutoff) continue
    if (Math.random() < 0.5) continue
    // Pay out the 1st of the following month — typical payday cadence
    const payday = new Date(when.getFullYear(), when.getMonth() + 1, 1, 12, 0, 0)
    if (payday > nowExp) continue
    await db
      .update(yogaClasses)
      .set({ paidAt: formatISO(payday) })
      .where(eq(yogaClasses.id, c.id))
  }

  console.log("")
  console.log("✅ Seed complete")
  console.log("")
  console.log(`Yoga: ${TEACHER_SPECS.length} teachers · ${classRows.length} class sessions over 52 weeks · ${workshopRows.length} workshops · 2 shalas`)
  console.log(`Students: ${6 + poolStudents.length} (named + international pool)`)
  console.log(`Finance: 8 expense categories · ${expenseValues.length} expenses · ${salesValues.length} restaurant sales`)
  console.log(`Memberships: ${planRows.length} plans · ${membershipValues.length} purchases distributed across 12 months`)
  console.log(`Seasonality: Dec/Jan/Feb peak · Sep low (factors ${Object.values(SEASONALITY).join(", ")})`)
  console.log("")
  console.log("Logins (password test123, or Google with same email):")
  console.log(`  Admin:   ${ADMIN_EMAIL}`)
  console.log(`  Manager: ${MANAGER_EMAIL}`)
  console.log(`  Waiter:  som@phanganyoga.com`)
  console.log(`  Teachers: ${TEACHER_SPECS.map((t) => `${t.slug}@phanganyoga.com`).join(", ")}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCrm()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
