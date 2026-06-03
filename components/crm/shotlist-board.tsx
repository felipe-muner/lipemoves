"use client"

import * as React from "react"
import { RotateCcw, Youtube } from "lucide-react"

import { PageHeader } from "@/components/crm/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Shot {
  id: string
  label: string
  /** YouTube search query for a good tutorial of this drill */
  search: string
}

interface ShotGroup {
  title: string
  shots: Shot[]
}

interface Section {
  title: string
  emoji: string
  groups: ShotGroup[]
}

const SECTIONS: Section[] = [
  {
    title: "Kettlebell",
    emoji: "🔔",
    groups: [
      {
        title: "Foundations / Technique",
        shots: [
          { id: "KB-01", label: "Hardstyle hinge & deadlift setup", search: "StrongFirst kettlebell deadlift hip hinge tutorial" },
          { id: "KB-02", label: "Two-hand swing", search: "StrongFirst hardstyle two hand kettlebell swing tutorial" },
          { id: "KB-03", label: "One-hand swing", search: "kettlebell one arm swing technique tutorial" },
          { id: "KB-04", label: "Hand-to-hand swing", search: "kettlebell hand to hand swing tutorial" },
          { id: "KB-05", label: "Goblet squat", search: "kettlebell goblet squat technique tutorial" },
          { id: "KB-06", label: "Clean (single)", search: "kettlebell clean tutorial no forearm bang" },
          { id: "KB-07", label: "Rack position breakdown", search: "kettlebell rack position tutorial" },
          { id: "KB-08", label: "Press (strict, single)", search: "StrongFirst kettlebell strict press tutorial" },
          { id: "KB-09", label: "Snatch", search: "kettlebell snatch tutorial no flop" },
          { id: "KB-10", label: "Turkish get-up (full, step-by-step)", search: "Turkish get up step by step kettlebell tutorial" },
        ],
      },
      {
        title: "Strength / Grind",
        shots: [
          { id: "KB-11", label: "Halo", search: "kettlebell halo tutorial" },
          { id: "KB-12", label: "Bent press", search: "kettlebell bent press tutorial" },
          { id: "KB-13", label: "Front squat (single, racked)", search: "single kettlebell front squat racked tutorial" },
          { id: "KB-14", label: "Bent-over row", search: "kettlebell bent over row tutorial" },
          { id: "KB-15", label: "Windmill", search: "kettlebell windmill tutorial Mark Wildman" },
          { id: "KB-16", label: "Bottoms-up press (stability/grip)", search: "kettlebell bottoms up press tutorial" },
        ],
      },
      {
        title: "Conditioning / Flows",
        shots: [
          { id: "KB-17", label: "Clean & press complex", search: "kettlebell clean and press complex workout" },
          { id: "KB-18", label: "Swing + squat + press flow", search: "kettlebell swing squat press complex flow" },
          { id: "KB-19", label: "Snatch ladder / EMOM example", search: "kettlebell snatch EMOM ladder workout" },
          { id: "KB-20", label: "Full kettlebell flow (single bell, continuous)", search: "single kettlebell flow continuous tutorial" },
        ],
      },
      {
        title: "Carries & Asymmetrical Loading",
        shots: [
          { id: "KB-21", label: "Racked carry (single)", search: "kettlebell racked carry tutorial" },
          { id: "KB-22", label: "Suitcase carry", search: "kettlebell suitcase carry tutorial anti lateral flexion" },
          { id: "KB-23", label: "Overhead / waiter walk", search: "kettlebell overhead waiter walk tutorial" },
          { id: "KB-24", label: "Bottoms-up carry", search: "kettlebell bottoms up carry tutorial" },
          { id: "KB-25", label: "Farmer / crush-grip carry", search: "kettlebell farmer carry tutorial" },
          { id: "KB-26", label: "Goblet march carry", search: "kettlebell goblet carry march tutorial" },
        ],
      },
      {
        title: "Skills & Variations",
        shots: [
          { id: "KB-27", label: "Figure 8", search: "kettlebell figure 8 tutorial" },
          { id: "KB-28", label: "Around-the-body pass", search: "kettlebell around the body pass tutorial" },
          { id: "KB-29", label: "Jerk / long-cycle jerk", search: "kettlebell jerk tutorial girevoy" },
          { id: "KB-30", label: "Sots press", search: "kettlebell sots press tutorial" },
          { id: "KB-31", label: "Z press (seated)", search: "kettlebell seated z press tutorial" },
          { id: "KB-32", label: "Half get-up", search: "kettlebell half get up tutorial" },
          { id: "KB-33", label: "Get-up to lunge variation", search: "kettlebell get up to lunge variation tutorial" },
          { id: "KB-34", label: "Floor press", search: "kettlebell floor press tutorial" },
          { id: "KB-35", label: "Single-arm renegade row", search: "single kettlebell renegade row tutorial" },
          { id: "KB-36", label: "Racked reverse lunge (single)", search: "kettlebell racked reverse lunge tutorial" },
          { id: "KB-37", label: "Pullover", search: "kettlebell pullover tutorial" },
          { id: "KB-38", label: "Single-leg RDL (loaded)", search: "kettlebell single leg romanian deadlift tutorial" },
          { id: "KB-39", label: "Loaded Cossack squat", search: "kettlebell cossack squat tutorial" },
          { id: "KB-40", label: "Pistol squat (KB counterbalance)", search: "kettlebell counterbalance pistol squat tutorial" },
        ],
      },
      {
        title: "Complexes & Programs",
        shots: [
          { id: "KB-41", label: "Clean & jerk / long cycle", search: "kettlebell long cycle clean and jerk tutorial" },
          { id: "KB-42", label: "Iron Cardio complex", search: "kettlebell iron cardio complex tutorial" },
          { id: "KB-43", label: "Quick & the Dead (Q&D)", search: "kettlebell quick and the dead Q&D single bell program" },
          { id: "KB-44", label: "Single-bell thruster (clean + squat + press)", search: "single kettlebell thruster tutorial" },
          { id: "KB-45", label: "Single-arm devil's press", search: "single arm kettlebell devils press tutorial" },
          { id: "KB-46", label: "Total Tension Complex (single)", search: "kettlebell total tension complex Pavel single bell" },
          { id: "KB-47", label: "Simple & Sinister follow-along", search: "kettlebell simple and sinister follow along" },
          { id: "KB-48", label: "Rite of Passage (C&P ladders)", search: "kettlebell rite of passage clean and press ladder" },
          { id: "KB-49", label: "Snatch test prep (100 in 5 min)", search: "kettlebell snatch test 100 reps 5 minutes prep" },
          { id: "KB-50", label: "Swing EMOM workout", search: "kettlebell swing EMOM workout follow along" },
          { id: "KB-51", label: "Clean-squat-press chain (single complex)", search: "single kettlebell clean squat press complex tutorial" },
          { id: "KB-52", label: "Advanced single-bell flow chain", search: "advanced kettlebell flow chain tutorial" },
        ],
      },
    ],
  },
  {
    title: "Mobility Drills",
    emoji: "🧘",
    groups: [
      {
        title: "Spine / Core",
        shots: [
          { id: "MOB-01", label: "Cat-cow + segmental spine waves", search: "cat cow segmental spinal articulation drill" },
          { id: "MOB-02", label: "Thoracic rotations (open book / quadruped)", search: "thoracic spine rotation open book mobility drill" },
          { id: "MOB-03", label: "Jefferson curl / spinal flexion control", search: "Jefferson curl tutorial spinal flexion" },
        ],
      },
      {
        title: "Hips",
        shots: [
          { id: "MOB-04", label: "90/90 hip switches & transitions", search: "90 90 hip mobility switch tutorial" },
          { id: "MOB-05", label: "Deep squat hold + pry", search: "deep squat hold and pry mobility drill" },
          { id: "MOB-06", label: "Cossack squat", search: "cossack squat tutorial mobility" },
          { id: "MOB-07", label: "Hip CARs (controlled articular rotations)", search: "hip CARs controlled articular rotations tutorial" },
          { id: "MOB-08", label: "Couch stretch / hip flexor opener", search: "couch stretch hip flexor tutorial" },
        ],
      },
      {
        title: "Shoulders",
        shots: [
          { id: "MOB-09", label: "Shoulder CARs", search: "shoulder CARs controlled articular rotations tutorial" },
          { id: "MOB-10", label: "Scapular control (wall slides, protraction/retraction)", search: "scapular control wall slides tutorial" },
          { id: "MOB-11", label: "Wrist & forearm prep (key for KB rack/get-up)", search: "wrist mobility and forearm warm up routine" },
        ],
      },
      {
        title: "Ankles / Lower body",
        shots: [
          { id: "MOB-12", label: "Ankle dorsiflexion drills", search: "ankle dorsiflexion mobility drills Squat University" },
          { id: "MOB-13", label: "Hamstring / posterior chain floss", search: "hamstring nerve floss posterior chain mobility" },
        ],
      },
      {
        title: "Full sequences (follow-along)",
        shots: [
          { id: "MOB-14", label: "5-min morning mobility flow", search: "5 minute morning mobility flow follow along" },
          { id: "MOB-15", label: "Pre-kettlebell warm-up routine", search: "kettlebell warm up routine follow along" },
          { id: "MOB-16", label: "Post-session cooldown / decompression flow", search: "cooldown mobility flow follow along stretch" },
        ],
      },
      {
        title: "Wrists & Grip (KB prep)",
        shots: [
          { id: "MOB-17", label: "Wrist CARs", search: "wrist CARs controlled articular rotations tutorial" },
          { id: "MOB-18", label: "Loaded wrist extension / push-up prep", search: "wrist extension strength push up prep tutorial" },
          { id: "MOB-19", label: "Reverse-prayer / flexor stretch", search: "wrist flexor reverse prayer stretch tutorial" },
          { id: "MOB-20", label: "Finger & grip opener", search: "finger and grip mobility opener tutorial" },
          { id: "MOB-21", label: "Forearm floss", search: "forearm nerve floss mobility tutorial" },
        ],
      },
      {
        title: "Core Control",
        shots: [
          { id: "MOB-22", label: "Dead bug", search: "dead bug exercise tutorial core control" },
          { id: "MOB-23", label: "Bird dog", search: "bird dog exercise tutorial" },
          { id: "MOB-24", label: "Hollow body hold", search: "hollow body hold tutorial progression" },
          { id: "MOB-25", label: "Segmental rolling", search: "segmental rolling pattern mobility drill" },
          { id: "MOB-26", label: "Side plank / lateral chain", search: "side plank progression tutorial" },
          { id: "MOB-27", label: "Cobra to child's pose flow", search: "cobra to child pose spinal flow tutorial" },
        ],
      },
      {
        title: "Deep Hips",
        shots: [
          { id: "MOB-28", label: "Frog stretch", search: "frog stretch hip mobility tutorial" },
          { id: "MOB-29", label: "Pigeon pose", search: "pigeon pose hip opener tutorial" },
          { id: "MOB-30", label: "Lizard lunge", search: "lizard lunge hip mobility tutorial" },
          { id: "MOB-31", label: "Shin-box get-up", search: "shin box get up mobility tutorial" },
          { id: "MOB-32", label: "Standing hip airplane", search: "hip airplane stability tutorial" },
          { id: "MOB-33", label: "World's greatest stretch", search: "worlds greatest stretch tutorial" },
          { id: "MOB-34", label: "Adductor rock-backs", search: "adductor rockback mobility drill tutorial" },
        ],
      },
      {
        title: "Shoulder Health",
        shots: [
          { id: "MOB-35", label: "Shoulder dislocates (stick/band)", search: "shoulder dislocates band stick mobility tutorial" },
          { id: "MOB-36", label: "Thread the needle", search: "thread the needle thoracic shoulder stretch tutorial" },
          { id: "MOB-37", label: "Prone Y-T-W raises", search: "prone Y T W shoulder raises tutorial" },
          { id: "MOB-38", label: "Wall angels", search: "wall angels shoulder mobility tutorial" },
          { id: "MOB-39", label: "Passive bar hang", search: "passive bar hang shoulder decompression tutorial" },
          { id: "MOB-40", label: "Banded shoulder distraction", search: "banded shoulder distraction mobility tutorial" },
        ],
      },
      {
        title: "Knees, Ankles & Feet",
        shots: [
          { id: "MOB-41", label: "Ankle CARs", search: "ankle CARs controlled articular rotations tutorial" },
          { id: "MOB-42", label: "Knee CARs", search: "knee CARs controlled articular rotations tutorial" },
          { id: "MOB-43", label: "Eccentric calf raises", search: "eccentric calf raise tutorial tendon health" },
          { id: "MOB-44", label: "Toe yoga / foot intrinsics", search: "toe yoga foot intrinsic muscles tutorial" },
          { id: "MOB-45", label: "ATG split squat", search: "ATG split squat knees over toes tutorial" },
        ],
      },
      {
        title: "More Follow-Along Flows",
        shots: [
          { id: "MOB-46", label: "10-min full-body mobility flow", search: "10 minute full body mobility flow follow along" },
          { id: "MOB-47", label: "Spine reset flow", search: "spine reset mobility flow follow along" },
          { id: "MOB-48", label: "Evening wind-down / parasympathetic flow", search: "evening wind down stretch parasympathetic flow follow along" },
        ],
      },
    ],
  },
]

const ALL_IDS = SECTIONS.flatMap((s) => s.groups.flatMap((g) => g.shots.map((sh) => sh.id)))
const TOTAL = ALL_IDS.length
const STORAGE_KEY = "lipemoves.shotlist.done.v1"

function ytSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export function ShotlistBoard() {
  const [done, setDone] = React.useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setDone(JSON.parse(raw))
    } catch {
      // ignore malformed storage
    }
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(done))
    } catch {
      // ignore quota errors
    }
  }, [done, hydrated])

  const toggle = (id: string) =>
    setDone((prev) => ({ ...prev, [id]: !prev[id] }))

  const reset = () => {
    if (window.confirm("Clear all recording progress?")) setDone({})
  }

  const completed = ALL_IDS.filter((id) => done[id]).length
  const pct = TOTAL === 0 ? 0 : Math.round((completed / TOTAL) * 100)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shot List"
        subtitle="Kettlebell & mobility videos to record. Tap “Watch” for a tutorial, then tick each one as you film — progress saves in this browser."
        actions={
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>
        }
      />

      {/* Progress bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {completed} of {TOTAL} recorded
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {SECTIONS.map((section) => {
        const sectionIds = section.groups.flatMap((g) => g.shots.map((s) => s.id))
        const sectionDone = sectionIds.filter((id) => done[id]).length
        return (
          <div key={section.title} className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {section.emoji} {section.title}
              </h2>
              <Badge variant="secondary" className="text-[10px]">
                {sectionDone}/{sectionIds.length}
              </Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {section.groups.map((group) => (
                <Card key={group.title}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      {group.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {group.shots.map((shot) => {
                      const isDone = !!done[shot.id]
                      return (
                        <div
                          key={shot.id}
                          className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60"
                        >
                          <label className="flex flex-1 cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggle(shot.id)}
                              className="mt-0.5 size-4 shrink-0"
                            />
                            <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                              {shot.id}
                            </span>
                            <span
                              className={
                                isDone
                                  ? "text-sm text-muted-foreground line-through"
                                  : "text-sm"
                              }
                            >
                              {shot.label}
                            </span>
                          </label>
                          <a
                            href={ytSearchUrl(shot.search)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Search YouTube: ${shot.search}`}
                            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-red-500 hover:text-red-500"
                          >
                            <Youtube className="size-3.5" />
                            Watch
                          </a>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
