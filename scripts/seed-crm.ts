import { db } from "@/lib/db"
import {
  users,
  teachers,
  yogaClasses,
  students,
  studentMemberships,
  classAttendance,
  teacherPayments,
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
} from "date-fns"

const ADMIN_EMAIL = "felipe.muner@gmail.com"

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
  await db.delete(teacherPayments)
  await db.delete(classAttendance)
  await db.delete(studentMemberships)
  await db.delete(yogaClasses)
  await db.delete(teachers)
  await db.delete(students)

  console.log("→ Promoting felipe to admin...")
  await upsertUser({
    email: ADMIN_EMAIL,
    name: "Felipe Muner",
    role: "admin",
  })

  console.log("→ Creating manager (head of center)...")
  await upsertUser({
    email: "maria@phanganyoga.com",
    name: "Maria Silva",
    password: "test123",
    role: "manager",
  })

  console.log("→ Creating teacher users (Gmail login auto-links)...")
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

  console.log("→ Creating teacher records...")
  const [tAnna, tLuca, tPutu] = await db
    .insert(teachers)
    .values([
      {
        userId: teacherUsers[0].id,
        name: "Anna Beck",
        email: "anna@phanganyoga.com",
        phone: "+66 80 123 4567",
        bio: "Vinyasa & Yin",
        payPerClassCents: 80000,
      },
      {
        userId: teacherUsers[1].id,
        name: "Luca Rossi",
        email: "luca@phanganyoga.com",
        phone: "+66 81 222 3333",
        bio: "Ashtanga",
        payPerClassCents: 100000,
      },
      {
        userId: teacherUsers[2].id,
        name: "Putu Surya",
        email: "putu@phanganyoga.com",
        phone: "+66 90 444 5555",
        bio: "Hatha & Pranayama",
        payPerClassCents: 90000,
      },
    ])
    .returning()

  console.log("→ Creating classes (past + upcoming)...")
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
        dropInPriceCents: 35000,
        capacity: 20,
      },
      {
        teacherId: tAnna.id,
        name: "Yin Restorative",
        scheduledAt: classAt(4, 17),
        durationMinutes: 90,
        dropInPriceCents: 35000,
        capacity: 18,
      },
      {
        teacherId: tLuca.id,
        name: "Ashtanga Mysore",
        scheduledAt: classAt(3, 7),
        durationMinutes: 90,
        dropInPriceCents: 40000,
        capacity: 15,
      },
      {
        teacherId: tPutu.id,
        name: "Hatha Morning",
        scheduledAt: classAt(2, 7),
        durationMinutes: 75,
        dropInPriceCents: 30000,
        capacity: 25,
      },
      {
        teacherId: tPutu.id,
        name: "Pranayama & Meditation",
        scheduledAt: classAt(5, 18),
        durationMinutes: 60,
        dropInPriceCents: 25000,
        capacity: 20,
      },
      // Upcoming
      {
        teacherId: tAnna.id,
        name: "Vinyasa Flow",
        scheduledAt: formatISO(addDays(now, 1)),
        durationMinutes: 75,
        dropInPriceCents: 35000,
        capacity: 20,
      },
      {
        teacherId: tLuca.id,
        name: "Ashtanga Led",
        scheduledAt: formatISO(addDays(now, 3)),
        durationMinutes: 90,
        dropInPriceCents: 40000,
        capacity: 15,
      },
      {
        teacherId: tPutu.id,
        name: "Hatha Morning",
        scheduledAt: formatISO(addDays(now, 2)),
        durationMinutes: 75,
        dropInPriceCents: 30000,
        capacity: 25,
      },
    ])
    .returning()

  console.log("→ Creating students...")
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

  console.log("→ Creating memberships...")
  const monthEndIso = formatISO(endOfMonth(now))
  await db.insert(studentMemberships).values([
    {
      studentEmail: "lena.mueller@example.com",
      type: "monthly",
      startsOn: formatISO(monthStart),
      endsOn: monthEndIso,
      pricePaidCents: 350000,
      currency: "thb",
    },
    {
      studentEmail: "sophie.dubois@example.com",
      type: "monthly",
      startsOn: formatISO(addDays(monthStart, 1)),
      endsOn: monthEndIso,
      pricePaidCents: 350000,
      currency: "thb",
    },
    {
      studentEmail: "james.oconnor@example.com",
      type: "drop_in",
      startsOn: formatISO(addDays(monthStart, 2)),
      pricePaidCents: 35000,
      currency: "thb",
    },
    {
      studentEmail: "tom.harris@example.com",
      type: "drop_in",
      startsOn: formatISO(addDays(monthStart, 3)),
      pricePaidCents: 40000,
      currency: "thb",
    },
    {
      studentEmail: "yuki.tanaka@example.com",
      type: "monthly",
      startsOn: formatISO(monthStart),
      endsOn: monthEndIso,
      pricePaidCents: 350000,
      currency: "thb",
    },
    {
      studentEmail: "ana.costa@example.com",
      type: "drop_in",
      startsOn: formatISO(addDays(monthStart, 4)),
      pricePaidCents: 30000,
      currency: "thb",
    },
  ])

  console.log("→ Creating class attendance...")
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

  console.log("→ Creating teacher payments...")
  const periodStart = formatISO(monthStart)
  const periodEnd = formatISO(endOfMonth(now))
  const lastMonthStart = formatISO(addDays(monthStart, -30))
  const lastMonthEnd = formatISO(addDays(monthStart, -1))
  await db.insert(teacherPayments).values([
    {
      teacherId: tAnna.id,
      periodStart,
      periodEnd,
      amountCents: 160000,
      currency: "thb",
      status: "pending",
      notes: "Vinyasa + Yin",
    },
    {
      teacherId: tAnna.id,
      periodStart: lastMonthStart,
      periodEnd: lastMonthEnd,
      amountCents: 240000,
      currency: "thb",
      status: "paid",
      paidAt: formatISO(addDays(monthStart, 1)),
    },
    {
      teacherId: tLuca.id,
      periodStart,
      periodEnd,
      amountCents: 100000,
      currency: "thb",
      status: "paid",
      paidAt: formatISO(addDays(now, -1)),
    },
    {
      teacherId: tLuca.id,
      periodStart: lastMonthStart,
      periodEnd: lastMonthEnd,
      amountCents: 200000,
      currency: "thb",
      status: "paid",
      paidAt: formatISO(addDays(monthStart, 2)),
    },
    {
      teacherId: tPutu.id,
      periodStart,
      periodEnd,
      amountCents: 180000,
      currency: "thb",
      status: "pending",
    },
  ])

  console.log("✅ Seed complete")
  console.log("")
  console.log("Logins (senha test123, ou Google com mesmo e-mail):")
  console.log(`  Admin:   ${ADMIN_EMAIL}     (Google)`)
  console.log(`  Manager: maria@phanganyoga.com`)
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
