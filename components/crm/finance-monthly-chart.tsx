"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface MonthlyChartDatum {
  month: string
  income: number
  expenses: number
}

export function FinanceMonthlyChart({
  data,
}: {
  data: MonthlyChartDatum[]
}) {
  const series = data.map((d) => ({
    ...d,
    net: d.income - d.expenses,
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value) => `${Number(value).toLocaleString()} ฿`}
          />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Income" />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
