"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle } from "lucide-react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  importClasses,
  type ImportClassRow,
  type ImportClassesResult,
} from "@/lib/actions/classes"

interface ParsedRow extends ImportClassRow {
  raw: Record<string, unknown>
}

const TEMPLATE_HEADERS = [
  "name",
  "teacher_email",
  "date",
  "time",
  "duration_minutes",
  "drop_in_price_thb",
  "capacity",
  "description",
]

const TEMPLATE_EXAMPLE = [
  {
    name: "Vinyasa Flow",
    teacher_email: "anna@phanganyoga.com",
    date: "2026-05-18",
    time: "08:00",
    duration_minutes: 75,
    drop_in_price_thb: 350,
    capacity: 20,
    description: "Morning flow",
  },
  {
    name: "Yin Restorative",
    teacher_email: "anna@phanganyoga.com",
    date: "2026-05-19",
    time: "17:00",
    duration_minutes: 90,
    drop_in_price_thb: 350,
    capacity: 18,
    description: "",
  },
]

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_EXAMPLE, {
    header: TEMPLATE_HEADERS,
  })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Classes")
  XLSX.writeFile(wb, "classes-template.xlsx")
}

function normalizeKey(k: string) {
  return k.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

function rowFromRaw(raw: Record<string, unknown>, line: number): ParsedRow {
  const norm: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) norm[normalizeKey(k)] = v

  // Handle Excel date serial numbers
  let date = norm.date as string | number | Date | undefined
  if (typeof date === "number") {
    const d = XLSX.SSF.parse_date_code(date)
    if (d) {
      const yyyy = String(d.y).padStart(4, "0")
      const mm = String(d.m).padStart(2, "0")
      const dd = String(d.d).padStart(2, "0")
      date = `${yyyy}-${mm}-${dd}`
    }
  } else if (date instanceof Date) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    date = `${yyyy}-${mm}-${dd}`
  }

  let time = norm.time as string | number | undefined
  if (typeof time === "number") {
    // Excel time as fraction of day
    const totalMinutes = Math.round(time * 24 * 60)
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
    const mm = String(totalMinutes % 60).padStart(2, "0")
    time = `${hh}:${mm}`
  }

  return {
    line,
    name: norm.name as string | undefined,
    teacherEmail: norm.teacher_email as string | undefined,
    date: date as string | undefined,
    time: time as string | undefined,
    durationMinutes: norm.duration_minutes as number | string | undefined,
    dropInPriceThb: norm.drop_in_price_thb as number | string | undefined,
    capacity: norm.capacity as number | string | undefined,
    description: norm.description as string | undefined,
    raw: norm,
  }
}

export function ImportClassesDialog() {
  const [open, setOpen] = React.useState(false)
  const [rows, setRows] = React.useState<ParsedRow[]>([])
  const [result, setResult] = React.useState<ImportClassesResult | null>(null)
  const [pending, startTransition] = React.useTransition()
  const fileRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = XLSX.read(data, { type: "array" })
        const sheetName = wb.SheetNames[0]
        const sheet = wb.Sheets[sheetName]
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
        })
        const parsed = raw.map((r, i) => rowFromRaw(r, i + 2)) // +2 because line 1 is header
        if (parsed.length === 0) {
          toast.error("No rows found in the file")
          return
        }
        setRows(parsed)
        setResult(null)
      } catch (err) {
        toast.error("Failed to parse file: " + (err as Error).message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function reset() {
    setRows([])
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function confirm() {
    startTransition(async () => {
      try {
        const payload = rows.map(({ raw: _raw, ...r }) => r)
        const res = await importClasses(payload)
        setResult(res)
        if (res.imported > 0) {
          toast.success(
            `Imported ${res.imported} classes` +
              (res.failed > 0 ? ` (${res.failed} failed)` : ""),
          )
          router.refresh()
        } else {
          toast.error("No classes imported — see errors below")
        }
      } catch (err) {
        toast.error((err as Error).message ?? "Import failed")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Import classes from Excel / CSV</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet with one class per row. Required columns:
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">name</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">date</code> (YYYY-MM-DD),
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">time</code> (HH:MM).
            Optional:
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">teacher_email</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">duration_minutes</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">drop_in_price_thb</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">capacity</code>,
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">description</code>.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 && !result && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                Need a starting point?
              </div>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Download template
              </Button>
            </div>

            <label
              htmlFor="import-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted py-10 hover:bg-muted/30"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">Choose .xlsx or .csv file</span>
              <span className="text-xs text-muted-foreground">
                We&apos;ll show a preview before anything is imported.
              </span>
              <input
                ref={fileRef}
                id="import-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </label>
          </div>
        )}

        {rows.length > 0 && !result && (
          <div className="space-y-3 py-2">
            <div className="text-sm">
              <span className="font-medium">{rows.length}</span> rows ready to
              import. Review and confirm.
            </div>
            <div className="max-h-[360px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Teacher email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.line}>
                      <TableCell className="text-muted-foreground">
                        {r.line}
                      </TableCell>
                      <TableCell className="font-medium">{r.name || "—"}</TableCell>
                      <TableCell>{r.teacherEmail || "—"}</TableCell>
                      <TableCell>{r.date || "—"}</TableCell>
                      <TableCell>{r.time || "—"}</TableCell>
                      <TableCell className="text-right">
                        {r.durationMinutes ?? 60}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.dropInPriceThb ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-md border bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {result.imported} imported
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-2 rounded-md border bg-red-500/10 px-3 py-1.5 text-red-700 dark:text-red-400">
                  <XCircle className="h-4 w-4" />
                  {result.failed} failed
                </div>
              )}
            </div>
            <div className="max-h-[360px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Line</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.results.map((r) => (
                    <TableRow key={r.line}>
                      <TableCell className="text-muted-foreground">
                        {r.line}
                      </TableCell>
                      <TableCell>
                        {r.ok ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                            <XCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.ok ? r.preview : r.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          {rows.length > 0 && !result && (
            <>
              <Button variant="outline" onClick={reset}>
                Choose another file
              </Button>
              <Button onClick={confirm} disabled={pending}>
                {pending ? "Importing..." : `Confirm import of ${rows.length} rows`}
              </Button>
            </>
          )}
          {result && (
            <Button onClick={() => setOpen(false)}>Done</Button>
          )}
          {rows.length === 0 && !result && (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
