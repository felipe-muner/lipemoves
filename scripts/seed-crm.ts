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
  startOfMonth,
  startOfWeek,
  endOfMonth,
  setHours,
  setMinutes,
  subMonths,
} from "date-fns"

const ADMIN_EMAIL = "felipe.muner@gmail.com"
const MANAGER_EMAIL = "kohphanganguide@gmail.com"

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
    `→ Regular classes (this week + 3 prior weeks) — ${REGULAR_CLASSES.length * 4} classes...`,
  )
  // Anchor classes on the current week's Monday, and replicate for the
  // previous 3 weeks so the payroll / finance pages have history.
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekOffsets = [-3, -2, -1, 0]
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

  console.log(`→ ${WORKSHOPS.length} workshops (next 4 weeks)...`)
  const now = new Date()
  const workshopRows = await db
    .insert(yogaClasses)
    .values(
      WORKSHOPS.map((w) => {
        const t = teacherBySlug.get(w.teacherSlug)
        if (!t) throw new Error(`Teacher slug ${w.teacherSlug} not found`)
        const scheduledAt = formatISO(
          setMinutes(setHours(addDays(now, w.daysFromNow), w.hour), 0),
        )
        return {
          name: w.name,
          employeeId: t.id,
          locationId: locMap[w.locationSlug],
          scheduledAt,
          durationMinutes: w.duration,
          priceThb: w.priceThb,
          teacherSharePercent: w.sharePercent,
          capacity: 30,
        }
      }),
    )
    .returning()

  console.log("→ 6 students...")
  await db.insert(students).values([
    { email: "lena.mueller@example.com",   name: "Lena Müller",       passport: "C01X45678", phone: "+49 151 22334455", nationality: "German"     },
    { email: "sophie.dubois@example.com",  name: "Sophie Dubois",     passport: "20FR98765", phone: "+33 6 12 34 56 78", nationality: "French"    },
    { email: "james.oconnor@example.com",  name: "James O'Connor",    passport: "P99887766", phone: "+1 415 555 0199",  nationality: "American"  },
    { email: "yuki.tanaka@example.com",    name: "Yuki Tanaka",       passport: "TR1234567", phone: "+81 90 1234 5678", nationality: "Japanese"  },
    { email: "ana.costa@example.com",      name: "Ana Costa",         passport: "BR998877",  phone: "+55 11 99876 5432", nationality: "Brazilian" },
    { email: "tom.harris@example.com",     name: "Tom Harris",        passport: "GB1029384", phone: "+44 7700 900123",  nationality: "British"   },
  ])

  console.log("→ Memberships...")
  const monthStart = startOfMonth(now)
  const monthEndIso = formatISO(endOfMonth(now))
  await db.insert(studentMemberships).values([
    { studentEmail: "lena.mueller@example.com",  type: "monthly", startsOn: formatISO(monthStart),              endsOn: monthEndIso, pricePaidThb: 3500 },
    { studentEmail: "sophie.dubois@example.com", type: "monthly", startsOn: formatISO(addDays(monthStart, 1)), endsOn: monthEndIso, pricePaidThb: 3500 },
    { studentEmail: "james.oconnor@example.com", type: "drop_in", startsOn: formatISO(addDays(monthStart, 2)), pricePaidThb: 350 },
    { studentEmail: "tom.harris@example.com",    type: "drop_in", startsOn: formatISO(addDays(monthStart, 3)), pricePaidThb: 400 },
    { studentEmail: "yuki.tanaka@example.com",   type: "monthly", startsOn: formatISO(monthStart),              endsOn: monthEndIso, pricePaidThb: 3500 },
    { studentEmail: "ana.costa@example.com",     type: "drop_in", startsOn: formatISO(addDays(monthStart, 4)), pricePaidThb: 300 },
  ])

  console.log("→ Class attendance (every class, 1–6 students each)...")
  const allStudentEmails = [
    "lena.mueller@example.com",
    "sophie.dubois@example.com",
    "james.oconnor@example.com",
    "yuki.tanaka@example.com",
    "ana.costa@example.com",
    "tom.harris@example.com",
  ]
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
    // Past classes: 2–6 students. Future workshops: 1–4 students (forward-booked).
    const target = isPast
      ? Math.floor(Math.random() * 5) + 2
      : Math.floor(Math.random() * 4) + 1
    const picks = shuffled(allStudentEmails).slice(0, target)
    for (const email of picks) {
      // ~70% of attendances are covered by a membership (price 0), 30% drop-in cash.
      const isDropIn = Math.random() < 0.3
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
    await db.insert(classAttendance).values(attendanceRows)
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
  await db.insert(products).values([
    { name: "Whey Protein Shake",  sku: "SHK-WHEY", category: "supplement", baseUnit: "g",     stockQty: 1000, servingSize: 30, priceThb: 180 },
    { name: "Fresh Coconut",       sku: "DRK-COCO", category: "drink",      baseUnit: "piece", stockQty: 24,   servingSize: 1,  priceThb: 90  },
    { name: "Açaí Bowl",           sku: "FD-ACAI",  category: "food",       baseUnit: "piece", stockQty: 12,   servingSize: 1,  priceThb: 220 },
    { name: "Kombucha 330ml",      sku: "DRK-KMB",  category: "drink",      baseUnit: "ml",    stockQty: 9900, servingSize: 330, priceThb: 120 },
    { name: "Avocado Toast",       sku: "FD-AVO",   category: "food",       baseUnit: "piece", stockQty: 15,   servingSize: 1,  priceThb: 180 },
    { name: "Yoga Mat",            sku: "RT-MAT",   category: "retail",     baseUnit: "piece", stockQty: 8,    servingSize: 1,  priceThb: 1500 },
  ])

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

  console.log("→ Sample expenses (last 3 months)...")
  const nowExp = new Date()
  type ExpSpec = {
    monthsAgo: number
    day: number
    slug: string
    amountThb: number
    vendor: string | null
    description: string
    paid?: boolean
    employee?: typeof waiterEmp | null
  }
  const EXPENSE_SPECS: ExpSpec[] = [
    // 2 months ago
    { monthsAgo: 2, day: 1,  slug: "rent",        amountThb: 25000, vendor: "Landlord",  description: "Monthly studio rent", paid: true },
    { monthsAgo: 2, day: 5,  slug: "utilities",   amountThb: 4200,  vendor: "PEA",       description: "Electricity bill",    paid: true },
    { monthsAgo: 2, day: 5,  slug: "utilities",   amountThb: 850,   vendor: "PWA",       description: "Water bill",          paid: true },
    { monthsAgo: 2, day: 7,  slug: "utilities",   amountThb: 1490,  vendor: "AIS Fibre", description: "Internet",            paid: true },
    { monthsAgo: 2, day: 10, slug: "supplies",    amountThb: 3200,  vendor: "Makro",     description: "Smoothie ingredients" , paid: true },
    { monthsAgo: 2, day: 12, slug: "supplies",    amountThb: 1800,  vendor: "Yoga Wares",description: "10 new yoga mats",    paid: true },
    { monthsAgo: 2, day: 18, slug: "marketing",   amountThb: 2500,  vendor: "Meta",      description: "Instagram ads",       paid: true },
    { monthsAgo: 2, day: 22, slug: "maintenance", amountThb: 900,   vendor: "Local handyman", description: "Plumber — main shala", paid: true },
    { monthsAgo: 2, day: 28, slug: "salary",      amountThb: 18000, vendor: null,        description: "Monthly salary",      paid: true, employee: waiterEmp },

    // 1 month ago
    { monthsAgo: 1, day: 1,  slug: "rent",        amountThb: 25000, vendor: "Landlord",  description: "Monthly studio rent", paid: true },
    { monthsAgo: 1, day: 5,  slug: "utilities",   amountThb: 3950,  vendor: "PEA",       description: "Electricity bill",    paid: true },
    { monthsAgo: 1, day: 5,  slug: "utilities",   amountThb: 920,   vendor: "PWA",       description: "Water bill",          paid: true },
    { monthsAgo: 1, day: 7,  slug: "utilities",   amountThb: 1490,  vendor: "AIS Fibre", description: "Internet",            paid: true },
    { monthsAgo: 1, day: 11, slug: "supplies",    amountThb: 2800,  vendor: "Makro",     description: "Smoothie + kombucha stock", paid: true },
    { monthsAgo: 1, day: 15, slug: "marketing",   amountThb: 3500,  vendor: "Meta",      description: "Workshop launch ads", paid: true },
    { monthsAgo: 1, day: 20, slug: "maintenance", amountThb: 1500,  vendor: "AC Pro",    description: "AC service — both shalas", paid: true },
    { monthsAgo: 1, day: 25, slug: "taxes_fees", amountThb: 1280,  vendor: "Bank",      description: "Card processing fees", paid: true },
    { monthsAgo: 1, day: 28, slug: "salary",      amountThb: 18000, vendor: null,        description: "Monthly salary",      paid: true, employee: waiterEmp },

    // Current month
    { monthsAgo: 0, day: 1,  slug: "rent",        amountThb: 25000, vendor: "Landlord",  description: "Monthly studio rent", paid: true },
    { monthsAgo: 0, day: 5,  slug: "utilities",   amountThb: 4500,  vendor: "PEA",       description: "Electricity bill",    paid: false },
    { monthsAgo: 0, day: 6,  slug: "supplies",    amountThb: 2100,  vendor: "Makro",     description: "Restock — smoothie ingredients", paid: true },
    { monthsAgo: 0, day: 8,  slug: "marketing",   amountThb: 1800,  vendor: "Meta",      description: "Boost retreat post",  paid: true },
    { monthsAgo: 0, day: 12, slug: "other",       amountThb: 650,   vendor: "Tesco",     description: "Cleaning supplies",   paid: true },
  ]

  for (const e of EXPENSE_SPECS) {
    const categoryId = catBySlug.get(e.slug)
    if (!categoryId) continue
    const ref = subMonths(nowExp, e.monthsAgo)
    const date = new Date(ref.getFullYear(), ref.getMonth(), e.day, 10, 0, 0)
    const incurredOn = formatISO(date)
    const paidAt = e.paid ? incurredOn : null
    await db.insert(expenses).values({
      categoryId,
      amountThb: e.amountThb,
      incurredOn,
      vendor: e.vendor,
      description: e.description,
      employeeId: e.employee?.id ?? null,
      paymentMethod: "transfer",
      paidAt,
    })
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
  console.log(`Yoga: ${TEACHER_SPECS.length} teachers · ${REGULAR_CLASSES.length} weekly classes · ${WORKSHOPS.length} upcoming workshops · 2 shalas`)
  console.log(`Finance: 8 expense categories · ${EXPENSE_SPECS.length} sample expenses · teacher payouts marked paid on the 1st`)
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
