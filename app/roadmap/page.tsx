"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  CheckCircle2,
  Circle,
  ArrowRightCircle,
  ArrowLeft,
  Flame,
  Target,
  Sparkles,
  ShieldCheck,
  Compass,
  Trophy,
  Zap,
  Repeat,
  HeartHandshake,
  Layers,
  ChevronRight,
  LayoutDashboard
} from "lucide-react"
import { ModeToggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Milestone {
  id: string
  title: string
  description: string
  actionTip: string
  icon: React.ComponentType<{ className?: string }>
}

interface JourneyPhase {
  phaseNumber: number
  tag: string
  title: string
  subtitle: string
  timeframe: string
  status: "completed" | "in-progress" | "upcoming"
  milestones: Milestone[]
}

const journeyPhases: JourneyPhase[] = [
  {
    phaseNumber: 1,
    tag: "Day One Ignition",
    title: "Foundation & Commitment",
    subtitle: "Overcoming inertia, defining core non-negotiables, and making starting too small to fail.",
    timeframe: "Days 1 – 7",
    status: "completed",
    milestones: [
      {
        id: "p1-1",
        title: "Define Your 3 Non-Negotiables",
        description: "Strip away the noise and choose 1–3 anchor habits that genuinely move the needle for your health, mindset, and craft.",
        actionTip: "Write them down where you see them every morning. Keep them concrete and binary (done or not done).",
        icon: Compass,
      },
      {
        id: "p1-2",
        title: "The 2-Minute Rule Protocol",
        description: "Scale every new habit down to a 2-minute starter ritual so taking action never relies on fleeting motivation.",
        actionTip: "Instead of 'read 1 hour', commit to opening the book and reading 1 page. Master the art of showing up first.",
        icon: Zap,
      },
      {
        id: "p1-3",
        title: "Environment Architecture",
        description: "Design your physical and digital surroundings so positive cues are obvious and negative distractions carry high friction.",
        actionTip: "Prepare your workout clothes the night before, place your water bottle on your desk, and charge your phone outside the bedroom.",
        icon: ShieldCheck,
      },
    ],
  },
  {
    phaseNumber: 2,
    tag: "The Resistance Zone",
    title: "Crucible & Momentum",
    subtitle: "Navigating the dopamine drop, pushing through bad days, and cementing daily momentum under real-world pressure.",
    timeframe: "Days 8 – 30",
    status: "in-progress",
    milestones: [
      {
        id: "p2-1",
        title: "The 'Never Miss Twice' Creed",
        description: "Life happens. One off-day is an anomaly, but two consecutive misses is the subtle birth of a bad habit.",
        actionTip: "If you have an emergency or illness, do a scaled-down 60-second version to preserve the mental streak.",
        icon: Repeat,
      },
      {
        id: "p2-2",
        title: "Habit Stacking Implementation",
        description: "Tie your new discipline directly to an established anchor routine that you already do automatically every day.",
        actionTip: "Formula: 'After I [Current Anchor Habit], I will immediately [New Target Habit] for 15 minutes.'",
        icon: Layers,
      },
      {
        id: "p2-3",
        title: "Crossing the Plateau of Latent Potential",
        description: "Trusting the unseen compounding effect when results haven't become visually obvious yet.",
        actionTip: "Track the inputs (the days checked), not the outputs. Consistency is the sole metric right now.",
        icon: Flame,
      },
    ],
  },
  {
    phaseNumber: 3,
    tag: "Subconscious Default",
    title: "Identity Transformation",
    subtitle: "Discipline shifts from conscious effort to automatic reflex. Habits cease being what you do and become who you are.",
    timeframe: "Days 31 – 66",
    status: "upcoming",
    milestones: [
      {
        id: "p3-1",
        title: "Identity-Based Narrative Shift",
        description: "Rewire your self-concept from 'I'm someone trying to eat clean or work out' to 'I am a disciplined athlete and builder'.",
        actionTip: "Every action you complete is a vote for the type of person you wish to become. Stack the votes daily.",
        icon: Target,
      },
      {
        id: "p3-2",
        title: "Weekly Reflection & Cadence Audit",
        description: "Systematic weekly reviews to evaluate energy levels, eliminate bottlenecks, and calibrate goal difficulty.",
        actionTip: "Ask every Sunday: What felt effortless? Where did friction spike? How can I optimize next week?",
        icon: Sparkles,
      },
      {
        id: "p3-3",
        title: "Disruption & Travel Resilience",
        description: "Developing bulletproof contingency routines that maintain your standards whether traveling, stressed, or swamped.",
        actionTip: "Have a preset 'Travel Mode' routine ready with zero equipment requirements.",
        icon: ShieldCheck,
      },
    ],
  },
  {
    phaseNumber: 4,
    tag: "Compounding Greatness",
    title: "Mastery & Unshakable Autonomy",
    subtitle: "Reaping the lifelong compound interest of unbroken self-trust and inspiring others through living example.",
    timeframe: "Days 67 – 100+",
    status: "upcoming",
    milestones: [
      {
        id: "p4-1",
        title: "Ironclad Internal Self-Trust",
        description: "Reaching the state where your word to yourself is absolute. When you decide to do something, it is as good as done.",
        actionTip: "Reflect on day one compared to now. You built self-confidence from verifiable daily evidence.",
        icon: Trophy,
      },
      {
        id: "p4-2",
        title: "Deliberate Practice & Fine Tuning",
        description: "Elevating the quality and depth of your habits without increasing stress or risk of burnout.",
        actionTip: "Focus on nuance: improving focus quality, posture, recovery, or creative depth during execution.",
        icon: Zap,
      },
      {
        id: "p4-3",
        title: "Inspire & Lead by Example",
        description: "Your consistent energy radiates into your family, friendships, and work. Excellence becomes your legacy.",
        actionTip: "Share your playbook with someone who is on their Day One. True mastery is teaching the path.",
        icon: HeartHandshake,
      },
    ],
  },
]

export default function Roadmap() {
  const [activeFilter, setActiveFilter] = useState<number | "all">("all")

  const filteredPhases = activeFilter === "all"
    ? journeyPhases
    : journeyPhases.filter((p) => p.phaseNumber === activeFilter)

  return (
    <div className="min-h-screen flex flex-col text-foreground selection:bg-primary/10">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <ArrowLeft className="size-4" />
            </div>
            <span>Go back</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <div className="flex items-center gap-2">
            <Image
              src="/logo_transparent.png"
              alt="Day One"
              width={22}
              height={22}
              className="dark:invert"
            />
            <span className="font-bold text-xs uppercase tracking-wider font-bernoru">Day One</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ModeToggle />
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard" className="flex items-center gap-1.5" />}
          >
            <LayoutDashboard className="size-3.5" />
            <span>Dashboard</span>
          </Button>
        </div>
      </header>

      {/* Main Roadmap Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Header Hero */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <Sparkles className="size-3.5" />
            <span>The 100-Day Transformation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-bernoru tracking-tight leading-[1.1]">
            THE PERSONAL JOURNEY
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
            Greatness isn&apos;t born from occasional heroics; it is forged by the small, quiet choices made day after day. Here is your blueprint from Day One to lifelong mastery.
          </p>

          {/* Progress Overview Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
              <span>Overall Journey Progress</span>
              <span className="text-foreground font-semibold">Phase 2: Active Focus (Day 12 of 100)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
              <div className="bg-emerald-500 h-full w-[25%]" title="Phase 1: Completed" />
              <div className="bg-orange-500 h-full w-[15%] animate-pulse" title="Phase 2: In Progress" />
              <div className="bg-muted-foreground/20 h-full w-[60%]" title="Phases 3 & 4" />
            </div>
          </div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All 4 Phases
          </button>
          {journeyPhases.map((phase) => (
            <button
              key={phase.phaseNumber}
              type="button"
              onClick={() => setActiveFilter(phase.phaseNumber)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                activeFilter === phase.phaseNumber
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span>Phase {phase.phaseNumber}</span>
              <span className="text-[10px] opacity-75">({phase.timeframe})</span>
            </button>
          ))}
        </div>

        {/* Phases Timeline List */}
        <div className="space-y-12">
          {filteredPhases.map((phase) => {
            const isCompleted = phase.status === "completed"
            const isInProgress = phase.status === "in-progress"

            return (
              <section key={phase.phaseNumber} className="relative pl-6 sm:pl-8 border-l-2 border-border space-y-6">
                {/* Timeline Node Dot */}
                <div
                  className={cn(
                    "absolute -left-[17px] top-1 flex size-8 items-center justify-center rounded-full border-2 bg-background shadow-sm transition-transform",
                    isCompleted && "border-emerald-500 text-emerald-500",
                    isInProgress && "border-orange-500 text-orange-500 ring-4 ring-orange-500/20 scale-110",
                    phase.status === "upcoming" && "border-muted-foreground/40 text-muted-foreground/40"
                  )}
                >
                  {isCompleted && <CheckCircle2 className="size-4" />}
                  {isInProgress && <ArrowRightCircle className="size-4 animate-pulse" />}
                  {phase.status === "upcoming" && <Circle className="size-4" />}
                </div>

                {/* Phase Header */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                        isCompleted && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                        isInProgress && "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
                        phase.status === "upcoming" && "bg-muted text-muted-foreground border border-border"
                      )}
                    >
                      {phase.timeframe} &bull; {isCompleted ? "Completed" : isInProgress ? "Current Focus" : "Upcoming"}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Phase {phase.phaseNumber}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold font-bernoru tracking-tight">
                    {phase.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    {phase.subtitle}
                  </p>
                </div>

                {/* Milestones Cards */}
                <div className="grid gap-4 sm:gap-5">
                  {phase.milestones.map((milestone) => {
                    const Icon = milestone.icon
                    return (
                      <div
                        key={milestone.id}
                        className={cn(
                          "rounded-xl border bg-card/75 backdrop-blur-sm p-5 shadow-sm transition-all hover:shadow-md hover:bg-card/90",
                          isInProgress && "border-orange-500/40 bg-card/85 ring-1 ring-orange-500/20"
                        )}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={cn(
                              "p-2.5 rounded-lg shrink-0 mt-0.5",
                              isCompleted && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                              isInProgress && "bg-orange-500/10 text-orange-500",
                              phase.status === "upcoming" && "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="size-5" />
                          </div>

                          <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-bold font-bernoru tracking-wide text-foreground">
                                {milestone.title}
                              </h3>
                              {isCompleted && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="size-3.5" /> Done
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {milestone.description}
                            </p>

                            {/* Practical Tip Pill */}
                            <div className="rounded-lg bg-muted/60 border border-border/50 p-3 text-xs text-foreground/90 space-y-1">
                              <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Zap className="size-3 text-orange-500" />
                                <span>Action Rule:</span>
                              </div>
                              <p className="text-muted-foreground leading-relaxed font-sans">
                                {milestone.actionTip}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        {/* Closing Quote Banner */}
        <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 sm:p-8 text-center space-y-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(249,115,22,0.06),transparent_70%]" />
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-500">
            Guiding Philosophy
          </p>
          <blockquote className="text-lg sm:text-xl font-signika italic text-foreground max-w-xl mx-auto">
            &ldquo;We are what we repeatedly do. Excellence, then, is not an act, but a habit.&rdquo;
          </blockquote>
          <p className="text-xs text-muted-foreground font-semibold">
            — Will Durant (summarizing Aristotle)
          </p>
        </div>
      </main>
    </div>
  )
}