"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { Mail, Send, Users, GraduationCap, BookOpen, BadgeCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  previewAudience,
  recentSimilarCampaign,
  sendCampaign,
} from "@/lib/actions/emails"
import type { AudienceFilter } from "@/lib/email/audience"
import type { CampaignTemplate } from "@/lib/email/templates/campaign"

interface ClassOption {
  id: string
  label: string
}

const TEMPLATES: {
  id: CampaignTemplate
  label: string
  description: string
  defaultSubject: string
  defaultBody: string
}[] = [
  {
    id: "announcement",
    label: "Announcement",
    description: "Subject + a clean body. Best for news, schedule changes, welcome notes.",
    defaultSubject: "A note from the studio",
    defaultBody:
      "We have a small update for you...\n\nThanks for being part of the studio.",
  },
  {
    id: "class_reminder",
    label: "Class reminder",
    description: "Use {{className}} and {{when}} placeholders if you want.",
    defaultSubject: "See you at {{className}}",
    defaultBody:
      "Just a friendly reminder: {{className}} is coming up on {{when}}.\n\nBring water and an open mind.",
  },
  {
    id: "membership_expiring",
    label: "Membership expiring",
    description: "Nudge students whose monthly plan is ending. {{endsOn}} placeholder available.",
    defaultSubject: "Your membership ends on {{endsOn}}",
    defaultBody:
      "Your monthly membership runs out on {{endsOn}}.\n\nReply to this email to renew and keep practicing without interruption.",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Free-form. Write anything; HTML wrapper handles the rest.",
    defaultSubject: "",
    defaultBody: "",
  },
]

export function EmailComposer({ classes }: { classes: ClassOption[] }) {
  const router = useRouter()
  const [template, setTemplate] = React.useState<CampaignTemplate>("announcement")
  const tpl = TEMPLATES.find((t) => t.id === template)!
  const [subject, setSubject] = React.useState(tpl.defaultSubject)
  const [body, setBody] = React.useState(tpl.defaultBody)

  React.useEffect(() => {
    setSubject(tpl.defaultSubject)
    setBody(tpl.defaultBody)
  }, [template, tpl.defaultBody, tpl.defaultSubject])

  // Audience filter
  const [includeTeachers, setIncludeTeachers] = React.useState(false)
  const [includeAllStudents, setIncludeAllStudents] = React.useState(true)
  const [activeOnly, setActiveOnly] = React.useState(false)
  const [selectedClassId, setSelectedClassId] = React.useState<string>("none")

  const audience: AudienceFilter = React.useMemo(
    () => ({
      teachers: includeTeachers,
      allStudents: includeAllStudents && !activeOnly,
      activeMembershipsOnly: includeAllStudents && activeOnly,
      classIds: selectedClassId !== "none" ? [selectedClassId] : [],
    }),
    [includeTeachers, includeAllStudents, activeOnly, selectedClassId],
  )

  const [audienceCount, setAudienceCount] = React.useState<number | null>(null)
  const [audienceSummary, setAudienceSummary] = React.useState<string>("")
  const [audienceSample, setAudienceSample] = React.useState<string[]>([])
  const [previewPending, startPreviewTransition] = React.useTransition()

  // Re-compute audience whenever filter changes (debounced via transition)
  React.useEffect(() => {
    startPreviewTransition(async () => {
      try {
        const r = await previewAudience(audience)
        setAudienceCount(r.count)
        setAudienceSummary(r.summary)
        setAudienceSample(r.sample)
      } catch {
        setAudienceCount(0)
      }
    })
  }, [audience])

  // Last-sent indicator for this subject
  const [lastSent, setLastSent] = React.useState<{
    sentAt: string | null
    recipientCount: number
    audienceSummary: string
  } | null>(null)
  React.useEffect(() => {
    if (!subject.trim()) {
      setLastSent(null)
      return
    }
    let cancelled = false
    recentSimilarCampaign(subject).then((row) => {
      if (!cancelled) setLastSent(row)
    })
    return () => {
      cancelled = true
    }
  }, [subject])

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [sendPending, startSendTransition] = React.useTransition()

  function handleSendClick() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required")
      return
    }
    if (!audienceCount) {
      toast.error("No recipients match the audience")
      return
    }
    setConfirmOpen(true)
  }

  function doSend() {
    startSendTransition(async () => {
      try {
        const result = await sendCampaign({ template, subject, bodyText: body, audience })
        toast.success(
          `Sent to ${result.sent}/${result.recipientCount}` +
            (result.failed > 0 ? ` (${result.failed} failed)` : ""),
        )
        setConfirmOpen(false)
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message ?? "Send failed")
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Left: composer */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`rounded-lg border p-3 text-left transition ${
                    template === t.id
                      ? "border-foreground bg-muted/40"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="mt-1 text-xs leading-snug text-muted-foreground">
                    {t.description}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Body *</Label>
              <Textarea
                id="body"
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message — blank lines become paragraphs.
You can use {{recipientName}} for personalisation."
              />
              <p className="text-xs text-muted-foreground">
                Available placeholders:{" "}
                <code className="rounded bg-muted px-1">{"{{recipientName}}"}</code>{" "}
                · <code className="rounded bg-muted px-1">{"{{recipientEmail}}"}</code>
              </p>
            </div>

            {lastSent?.sentAt && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <span className="font-medium">Same subject was sent before:</span>{" "}
                  {format(new Date(lastSent.sentAt), "MMM dd, yyyy HH:mm")} —{" "}
                  {lastSent.recipientCount} recipients ({lastSent.audienceSummary})
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: audience + send */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              icon={GraduationCap}
              label="Teachers"
              description="All active teachers"
              checked={includeTeachers}
              onChange={setIncludeTeachers}
            />
            <ToggleRow
              icon={Users}
              label="Students"
              description="Everyone in the students table"
              checked={includeAllStudents}
              onChange={setIncludeAllStudents}
            />
            <div className="ml-8">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  disabled={!includeAllStudents}
                  className="h-4 w-4 rounded border"
                />
                <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
                Only students with an active monthly membership
              </label>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-normal">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Attendees of one class
              </Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a class…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Recipients
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">
                {previewPending ? "…" : (audienceCount ?? 0)}
              </span>
              <span className="text-sm text-muted-foreground">
                {audienceCount === 1 ? "person" : "people"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{audienceSummary}</div>
            {audienceSample.length > 0 && (
              <div className="text-xs text-muted-foreground line-clamp-2">
                {audienceSample.join(", ")}
                {audienceCount && audienceCount > audienceSample.length
                  ? ` +${audienceCount - audienceSample.length} more`
                  : ""}
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSendClick}
              disabled={!audienceCount || !subject.trim() || !body.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              Send to {audienceCount ?? 0} {audienceCount === 1 ? "person" : "people"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Confirm send</DialogTitle>
            <DialogDescription>
              You&apos;re about to send <strong>{subject}</strong> to{" "}
              <strong>{audienceCount}</strong> recipients ({audienceSummary}).
              This is real and can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>

          {lastSent?.sentAt && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                The same subject was sent on{" "}
                <strong>
                  {format(new Date(lastSent.sentAt), "MMM dd, yyyy HH:mm")}
                </strong>{" "}
                to {lastSent.recipientCount} people. Make sure this isn&apos;t a
                duplicate.
              </div>
            </div>
          )}

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="text-xs uppercase text-muted-foreground">
              Preview (first recipient)
            </div>
            <div className="mt-2 font-medium">{subject}</div>
            <div className="mt-1 whitespace-pre-line text-muted-foreground line-clamp-5">
              {body}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doSend} disabled={sendPending}>
              {sendPending ? "Sending…" : `Yes, send ${audienceCount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/30">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border"
      />
      <div className="flex flex-1 items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
    </label>
  )
}

