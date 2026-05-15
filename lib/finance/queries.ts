import { db } from "@/lib/db"
import {
  sales,
  studentMemberships,
  classAttendance,
  yogaClasses,
  expenses,
  expenseCategories,
  employees,
} from "@/lib/db/schema"
import {
  and,
  desc,
  eq,
  gte,
  isNotNull,
  lte,
  sql,
} from "drizzle-orm"
import { formatISO } from "date-fns"

export type DateRange = { from: Date; to: Date }

export interface IncomeRow {
  source: "restaurant" | "membership" | "drop_in"
  date: string
  description: string
  amountThb: number
  ref?: string
}

export interface CategoryBreakdown {
  /** Slug for manual categories, or "teacher_payouts" for the synthetic line. */
  key: string
  name: string
  color: string
  amountThb: number
}

export interface FinanceSummary {
  income: {
    total: number
    restaurant: number
    memberships: number
    dropIn: number
  }
  expenses: {
    total: number
    manual: number
    payouts: number
    breakdown: CategoryBreakdown[]
  }
  net: number
  margin: number
}

function rangeIso(range: DateRange) {
  return { from: formatISO(range.from), to: formatISO(range.to) }
}

// ─── Income ─────────────────────────────────────────────

/** Daily restaurant totals (one row per day in range). */
export async function restaurantDailyTotals(range: DateRange) {
  const { from, to } = rangeIso(range)
  const rows = await db
    .select({
      day: sql<string>`to_char(${sales.paidAt} at time zone 'utc', 'YYYY-MM-DD')`,
      totalThb: sql<number>`coalesce(sum(${sales.totalThb}), 0)::int`,
      salesCount: sql<number>`count(*)::int`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.status, "paid"),
        isNotNull(sales.paidAt),
        gte(sales.paidAt, from),
        lte(sales.paidAt, to),
      ),
    )
    .groupBy(sql`to_char(${sales.paidAt} at time zone 'utc', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${sales.paidAt} at time zone 'utc', 'YYYY-MM-DD') desc`)

  return rows
}

/** Membership purchases in range. */
export async function membershipPurchases(range: DateRange) {
  const { from, to } = rangeIso(range)
  return db
    .select({
      id: studentMemberships.id,
      date: studentMemberships.createdAt,
      type: studentMemberships.type,
      studentEmail: studentMemberships.studentEmail,
      amountThb: studentMemberships.pricePaidThb,
    })
    .from(studentMemberships)
    .where(
      and(
        gte(studentMemberships.createdAt, from),
        lte(studentMemberships.createdAt, to),
      ),
    )
    .orderBy(desc(studentMemberships.createdAt))
}

/** Drop-in payments (per-attendance cash, when not membership-covered). */
export async function dropInPayments(range: DateRange) {
  const { from, to } = rangeIso(range)
  return db
    .select({
      id: classAttendance.id,
      date: classAttendance.checkedInAt,
      classId: classAttendance.classId,
      className: yogaClasses.name,
      studentEmail: classAttendance.studentEmail,
      amountThb: classAttendance.pricePaidThb,
      paymentMethod: classAttendance.paymentMethod,
    })
    .from(classAttendance)
    .leftJoin(yogaClasses, eq(yogaClasses.id, classAttendance.classId))
    .where(
      and(
        gte(classAttendance.checkedInAt, from),
        lte(classAttendance.checkedInAt, to),
        sql`${classAttendance.pricePaidThb} > 0`,
      ),
    )
    .orderBy(desc(classAttendance.checkedInAt))
}

// ─── Expenses ──────────────────────────────────────────

/** Manual expenses (rent, utilities, salaries, ...). */
export async function manualExpenses(range: DateRange) {
  const { from, to } = rangeIso(range)
  return db
    .select({
      id: expenses.id,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      categorySlug: expenseCategories.slug,
      categoryColor: expenseCategories.color,
      amountThb: expenses.amountThb,
      incurredOn: expenses.incurredOn,
      vendor: expenses.vendor,
      description: expenses.description,
      employeeId: expenses.employeeId,
      employeeName: employees.name,
      paidAt: expenses.paidAt,
      paymentMethod: expenses.paymentMethod,
      receiptUrl: expenses.receiptUrl,
    })
    .from(expenses)
    .innerJoin(
      expenseCategories,
      eq(expenseCategories.id, expenses.categoryId),
    )
    .leftJoin(employees, eq(employees.id, expenses.employeeId))
    .where(
      and(gte(expenses.incurredOn, from), lte(expenses.incurredOn, to)),
    )
    .orderBy(desc(expenses.incurredOn))
}

/**
 * Teacher payouts on cash-basis: only counted when admin marked paid via
 * /dashboard/payments (yogaClasses.paidAt). Payout amount = attendees × price × share %.
 */
export async function teacherPayouts(range: DateRange) {
  const { from, to } = rangeIso(range)

  const attendeesSub = db
    .select({
      classId: classAttendance.classId,
      n: sql<number>`count(*)::int`.as("n"),
    })
    .from(classAttendance)
    .groupBy(classAttendance.classId)
    .as("attendees")

  const rows = await db
    .select({
      id: yogaClasses.id,
      paidAt: yogaClasses.paidAt,
      scheduledAt: yogaClasses.scheduledAt,
      className: yogaClasses.name,
      priceThb: yogaClasses.priceThb,
      sharePercent: yogaClasses.teacherSharePercent,
      teacherId: yogaClasses.employeeId,
      teacherName: employees.name,
      attendeeCount: sql<number>`coalesce(${attendeesSub.n}, 0)::int`,
    })
    .from(yogaClasses)
    .leftJoin(employees, eq(employees.id, yogaClasses.employeeId))
    .leftJoin(attendeesSub, eq(attendeesSub.classId, yogaClasses.id))
    .where(
      and(
        isNotNull(yogaClasses.paidAt),
        gte(yogaClasses.paidAt, from),
        lte(yogaClasses.paidAt, to),
      ),
    )
    .orderBy(desc(yogaClasses.paidAt))

  return rows.map((r) => {
    const gross = r.attendeeCount * r.priceThb
    const payoutThb = Math.round((gross * r.sharePercent) / 100)
    return { ...r, payoutThb }
  })
}

// ─── Aggregates ────────────────────────────────────────

export async function financeSummary(range: DateRange): Promise<FinanceSummary> {
  const [restaurant, memberships, dropIns, manual, payouts] = await Promise.all([
    restaurantDailyTotals(range),
    membershipPurchases(range),
    dropInPayments(range),
    manualExpenses(range),
    teacherPayouts(range),
  ])

  const restaurantTotal = restaurant.reduce((a, b) => a + b.totalThb, 0)
  const membershipsTotal = memberships.reduce((a, b) => a + b.amountThb, 0)
  const dropInTotal = dropIns.reduce((a, b) => a + b.amountThb, 0)
  const incomeTotal = restaurantTotal + membershipsTotal + dropInTotal

  const manualTotal = manual.reduce((a, b) => a + b.amountThb, 0)
  const payoutsTotal = payouts.reduce((a, b) => a + b.payoutThb, 0)
  const expenseTotal = manualTotal + payoutsTotal

  const byKey = new Map<string, CategoryBreakdown>()
  for (const m of manual) {
    const cur = byKey.get(m.categorySlug) ?? {
      key: m.categorySlug,
      name: m.categoryName,
      color: m.categoryColor,
      amountThb: 0,
    }
    cur.amountThb += m.amountThb
    byKey.set(m.categorySlug, cur)
  }
  if (payoutsTotal > 0) {
    byKey.set("teacher_payouts", {
      key: "teacher_payouts",
      name: "Teacher payouts",
      color: "#0f766e",
      amountThb: payoutsTotal,
    })
  }
  const breakdown = Array.from(byKey.values()).sort(
    (a, b) => b.amountThb - a.amountThb,
  )

  const net = incomeTotal - expenseTotal
  const margin = incomeTotal > 0 ? Math.round((net / incomeTotal) * 100) : 0

  return {
    income: {
      total: incomeTotal,
      restaurant: restaurantTotal,
      memberships: membershipsTotal,
      dropIn: dropInTotal,
    },
    expenses: {
      total: expenseTotal,
      manual: manualTotal,
      payouts: payoutsTotal,
      breakdown,
    },
    net,
    margin,
  }
}

export type MonthBucket = { month: string; income: number; expenses: number }

function bucketKey(iso: string): string {
  // YYYY-MM
  return iso.slice(0, 7)
}

/** Monthly bucketed income vs expense series for the given range. */
export async function monthlySeries(range: DateRange): Promise<MonthBucket[]> {
  const [restaurant, memberships, dropIns, manual, payouts] = await Promise.all([
    restaurantDailyTotals(range),
    membershipPurchases(range),
    dropInPayments(range),
    manualExpenses(range),
    teacherPayouts(range),
  ])

  const map = new Map<string, MonthBucket>()
  const bump = (iso: string, kind: "income" | "expenses", amount: number) => {
    const month = bucketKey(iso)
    const cur =
      map.get(month) ?? { month, income: 0, expenses: 0 }
    cur[kind] += amount
    map.set(month, cur)
  }

  for (const r of restaurant) bump(r.day, "income", r.totalThb)
  for (const m of memberships) bump(m.date, "income", m.amountThb)
  for (const d of dropIns) bump(d.date, "income", d.amountThb)
  for (const e of manual) bump(e.incurredOn, "expenses", e.amountThb)
  for (const p of payouts) {
    if (p.paidAt) bump(p.paidAt, "expenses", p.payoutThb)
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
}

/** Active categories, sorted by sortOrder then name. */
export async function listExpenseCategories() {
  return db
    .select({
      id: expenseCategories.id,
      name: expenseCategories.name,
      slug: expenseCategories.slug,
      color: expenseCategories.color,
      description: expenseCategories.description,
      isActive: expenseCategories.isActive,
      isSystem: expenseCategories.isSystem,
      sortOrder: expenseCategories.sortOrder,
    })
    .from(expenseCategories)
    .orderBy(expenseCategories.sortOrder, expenseCategories.name)
}
