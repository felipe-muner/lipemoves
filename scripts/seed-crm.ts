import { db } from "@/lib/db"
import {
  users,
  teachers,
  yogaClasses,
  students,
  studentMemberships,
  classAttendance,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import {
  addDays,
  addHours,
  formatISO,
  startOfMonth,
  endOfMonth,
  setHours,
  setMinutes,
  subDays,
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

async function main() {
  console.log("→ Cleaning previous CRM data...")
  await db.delete(classAttendance)
  await db.delete(studentMemberships)
  await db.delete(yogaClasses)
  await db.delete(teachers)
  await db.delete(students)

  console.log("→ Promoting admin...")
  await upsertUser({
    email: ADMIN_EMAIL,
    name: "Felipe Muner",
    role: "admin",
  })

  console.log("→ Manager...")
  await upsertUser({
    email: MANAGER_EMAIL,
    name: "Manager Koh Phangan",
    role: "manager",
  })

  console.log("→ Teacher users (auto-link on Google login)...")
  const teacherUsers = await Promise.all([
    upsertUser({
      email: "anna@phanganyoga.com",
      name: "Anna Beck",
      password: "test123",
      role: "teacher",
    }),
    upsertUser({
      email: "luca@phanganyoga.com",
      name: "Luca Rossi",
      password: "test123",
      role: "teacher",
    }),
    upsertUser({
      email: "putu@phanganyoga.com",
      name: "Putu Surya",
      password: "test123",
      role: "teacher",
    }),
  ])

  console.log("→ Teacher records...")
  const [tAnna, tLuca, tPutu] = await db
    .insert(teachers)
    .values([
      {
        userId: teacherUsers[0].id,
        name: "Anna Beck",
        email: "anna@phanganyoga.com",
        phone: "+66 80 123 4567",
        passport: "C01X11122",
        bio: "Vinyasa & Yin",
      },
      {
        userId: teacherUsers[1].id,
        name: "Luca Rossi",
        email: "luca@phanganyoga.com",
        phone: "+66 81 222 3333",
        passport: "YA8800123",
        bio: "Ashtanga",
      },
      {
        userId: teacherUsers[2].id,
        name: "Putu Surya",
        email: "putu@phanganyoga.com",
        phone: "+66 90 444 5555",
        passport: "P9988776",
        bio: "Hatha & Pranayama",
      },
    ])
    .returning()

  console.log("→ Classes (past + upcoming)...")
  const now = new Date()
  const monthStart = startOfMonth(now)

  function classAt(daysFromMonthStart: number, hour: number) {
    return formatISO(
      setMinutes(setHours(addDays(monthStart, daysFromMonthStart), hour), 0),
    )
  }

  const classRows = await db
    .insert(yogaClasses)
    .values([
      {
        teacherId: tAnna.id,
        name: "Vinyasa Flow",
        scheduledAt: classAt(2, 8),
        durationMinutes: 75,
        priceThb: 350,
        teacherSharePercent: 70,
        capacity: 20,
      },
      {
        teacherId: tAnna.id,
        name: "Yin Restorative",
        scheduledAt: classAt(4, 17),
        durationMinutes: 90,
        priceThb: 350,
        teacherSharePercent: 70,
        capacity: 18,
      },
      {
        teacherId: tLuca.id,
        name: "Ashtanga Mysore",
        scheduledAt: classAt(3, 7),
        durationMinutes: 90,
        priceThb: 400,
        teacherSharePercent: 75,
        capacity: 15,
      },
      {
        teacherId: tPutu.id,
        name: "Hatha Morning",
        scheduledAt: classAt(2, 7),
        durationMinutes: 75,
        priceThb: 300,
        teacherSharePercent: 65,
        capacity: 25,
      },
      {
        teacherId: tPutu.id,
        name: "Pranayama & Meditation",
        scheduledAt: classAt(5, 18),
        durationMinutes: 60,
        priceThb: 250,
        teacherSharePercent: 65,
        capacity: 20,
      },
      // Upcoming
      {
        teacherId: tAnna.id,
        name: "Vinyasa Flow",
        scheduledAt: formatISO(addDays(now, 1)),
        durationMinutes: 75,
        priceThb: 350,
        teacherSharePercent: 70,
        capacity: 20,
      },
      {
        teacherId: tLuca.id,
        name: "Ashtanga Led",
        scheduledAt: formatISO(addDays(now, 3)),
        durationMinutes: 90,
        priceThb: 400,
        teacherSharePercent: 75,
        capacity: 15,
      },
      {
        teacherId: tPutu.id,
        name: "Hatha Morning",
        scheduledAt: formatISO(addDays(now, 2)),
        durationMinutes: 75,
        priceThb: 300,
        teacherSharePercent: 65,
        capacity: 25,
      },
    ])
    .returning()

  console.log("→ Students...")
  await db.insert(students).values([
    {
      email: "lena.mueller@example.com",
      name: "Lena Müller",
      passport: "C01X45678",
      phone: "+49 151 22334455",
      nationality: "German",
    },
    {
      email: "sophie.dubois@example.com",
      name: "Sophie Dubois",
      passport: "20FR98765",
      phone: "+33 6 12 34 56 78",
      nationality: "French",
    },
    {
      email: "james.oconnor@example.com",
      name: "James O'Connor",
      passport: "P99887766",
      phone: "+1 415 555 0199",
      nationality: "American",
    },
    {
      email: "yuki.tanaka@example.com",
      name: "Yuki Tanaka",
      passport: "TR1234567",
      phone: "+81 90 1234 5678",
      nationality: "Japanese",
    },
    {
      email: "ana.costa@example.com",
      name: "Ana Costa",
      passport: "BR998877",
      phone: "+55 11 99876 5432",
      nationality: "Brazilian",
    },
    {
      email: "tom.harris@example.com",
      name: "Tom Harris",
      passport: "GB1029384",
      phone: "+44 7700 900123",
      nationality: "British",
    },
  ])

  console.log("→ Memberships...")
  const monthEndIso = formatISO(endOfMonth(now))
  await db.insert(studentMemberships).values([
    {
      studentEmail: "lena.mueller@example.com",
      type: "monthly",
      startsOn: formatISO(monthStart),
      endsOn: monthEndIso,
      pricePaidThb: 3500,
    },
    {
      studentEmail: "sophie.dubois@example.com",
      type: "monthly",
      startsOn: formatISO(addDays(monthStart, 1)),
      endsOn: monthEndIso,
      pricePaidThb: 3500,
    },
    {
      studentEmail: "james.oconnor@example.com",
      type: "drop_in",
      startsOn: formatISO(addDays(monthStart, 2)),
      pricePaidThb: 350,
    },
    {
      studentEmail: "tom.harris@example.com",
      type: "drop_in",
      startsOn: formatISO(addDays(monthStart, 3)),
      pricePaidThb: 400,
    },
    {
      studentEmail: "yuki.tanaka@example.com",
      type: "monthly",
      startsOn: formatISO(monthStart),
      endsOn: monthEndIso,
      pricePaidThb: 3500,
    },
    {
      studentEmail: "ana.costa@example.com",
      type: "drop_in",
      startsOn: formatISO(addDays(monthStart, 4)),
      pricePaidThb: 300,
    },
  ])

  console.log("→ Class attendance...")
  await db.insert(classAttendance).values([
    {
      classId: classRows[0].id,
      studentEmail: "lena.mueller@example.com",
      checkedInAt: formatISO(addHours(new Date(classRows[0].scheduledAt), 0)),
    },
    {
      classId: classRows[0].id,
      studentEmail: "sophie.dubois@example.com",
      checkedInAt: formatISO(addHours(new Date(classRows[0].scheduledAt), 0)),
    },
    {
      classId: classRows[1].id,
      studentEmail: "lena.mueller@example.com",
      checkedInAt: formatISO(addHours(new Date(classRows[1].scheduledAt), 0)),
    },
    {
      classId: classRows[2].id,
      studentEmail: "james.oconnor@example.com",
      checkedInAt: formatISO(addHours(new Date(classRows[2].scheduledAt), 0)),
    },
    {
      classId: classRows[3].id,
      studentEmail: "yuki.tanaka@example.com",
      checkedInAt: formatISO(addHours(new Date(classRows[3].scheduledAt), 0)),
    },
    {
      classId: classRows[4].id,
      studentEmail: "ana.costa@example.com",
      checkedInAt: formatISO(addHours(new Date(classRows[4].scheduledAt), 0)),
    },
  ])

  // Suppress unused warning
  void subDays

  console.log("✅ Seed complete")
  console.log("")
  console.log("Logins (password test123, or Google with same email):")
  console.log(`  Admin:   ${ADMIN_EMAIL}   (Google)`)
  console.log(`  Manager: ${MANAGER_EMAIL}   (Google)`)
  console.log(`  Teacher: anna@phanganyoga.com`)
  console.log(`  Teacher: luca@phanganyoga.com`)
  console.log(`  Teacher: putu@phanganyoga.com`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
