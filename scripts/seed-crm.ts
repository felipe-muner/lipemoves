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

async function main() {
  console.log("→ Cleaning previous CRM data...")
  await db.delete(saleItems)
  await db.delete(sales)
  await db.delete(stockMovements)
  await db.delete(products)
  await db.delete(restaurantTables)
  await db.delete(classAttendance)
  await db.delete(studentMemberships)
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

  console.log("→ 21 regular classes (this week, 2 locations)...")
  // Anchor classes on the current week's Monday
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const classRows = await db
    .insert(yogaClasses)
    .values(
      REGULAR_CLASSES.map((c) => {
        const t = teacherBySlug.get(c.teacherSlug)
        if (!t) throw new Error(`Teacher slug ${c.teacherSlug} not found`)
        const scheduledAt = formatISO(
          setMinutes(setHours(addDays(weekStart, c.dayOffset), c.hour), 0),
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
    )
    .returning()

  console.log(`→ ${WORKSHOPS.length} workshops (next 4 weeks)...`)
  const now = new Date()
  await db.insert(yogaClasses).values(
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

  console.log("→ Class attendance (sample)...")
  await db.insert(classAttendance).values(
    classRows.slice(0, 5).map((c, i) => ({
      classId: c.id,
      studentEmail: [
        "lena.mueller@example.com",
        "sophie.dubois@example.com",
        "james.oconnor@example.com",
        "yuki.tanaka@example.com",
        "ana.costa@example.com",
      ][i],
      checkedInAt: formatISO(addHours(new Date(c.scheduledAt), 0)),
    })),
  )

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

  console.log("")
  console.log("✅ Seed complete")
  console.log("")
  console.log(`Yoga: ${TEACHER_SPECS.length} teachers · ${REGULAR_CLASSES.length} weekly classes · ${WORKSHOPS.length} upcoming workshops · 2 shalas`)
  console.log("")
  console.log("Logins (password test123, or Google with same email):")
  console.log(`  Admin:   ${ADMIN_EMAIL}`)
  console.log(`  Manager: ${MANAGER_EMAIL}`)
  console.log(`  Waiter:  som@phanganyoga.com`)
  console.log(`  Teachers: ${TEACHER_SPECS.map((t) => `${t.slug}@phanganyoga.com`).join(", ")}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
