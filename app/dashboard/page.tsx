import { createClient } from "@/lib/server"
import { getHabits } from "@/app/habits/action"
import { getLocalDateString } from "@/lib/habits"
import { getTodos } from "@/app/todos/action"
import { quoteItems } from "@/lib/quotes"
import {
  Flame,
  CheckCircle,
  Target,
  TrendingUp,
  Sparkles,
  User,
  Calendar,
  CheckCircle2,
  Circle,
  ArrowRight,
  List,
  Plus,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getTodoTimingStatus } from "@/lib/todos"

function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch real habits and todos concurrently
  const [{ habits }, { todos }] = await Promise.all([
    getHabits(),
    getTodos(),
  ])

  const userName = user?.email ? user.email.split("@")[0] : "Hero"
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const todayStr = getLocalDateString()

  // 1. STREAK: Best streak across habits
  const streaks = habits.map((h) => Number(h.streak) || 0)
  const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0
  const completedTodayHabits = habits.filter((h) => h.completed_today).length
  const totalHabits = habits.length

  let streakSubtitle = "No habits tracked yet"
  if (totalHabits > 0) {
    if (completedTodayHabits === totalHabits) {
      streakSubtitle = `All ${totalHabits} habit${totalHabits === 1 ? "" : "s"} done today! 🔥`
    } else {
      streakSubtitle = `${completedTodayHabits} of ${totalHabits} habit${totalHabits === 1 ? "" : "s"} done today`
    }
  }

  // 2. CONSISTENCY RATE: Calculated over the last 7 days from habit completions or todos
  const now = new Date()
  const last7Days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    last7Days.push(getLocalDateString(d))
  }

  let actualCheckinsLast7Days = 0
  const maxPossibleCheckins = totalHabits * 7

  habits.forEach((h) => {
    const dates = Array.isArray(h.completed_dates) ? h.completed_dates : []
    last7Days.forEach((day) => {
      if (dates.includes(day) || (day === todayStr && h.completed_today)) {
        actualCheckinsLast7Days++
      }
    })
  })

  let consistencyRate = 0
  let consistencySubtitle = "Start habits to track consistency"

  if (maxPossibleCheckins > 0) {
    const estimatedCheckins = Math.max(
      actualCheckinsLast7Days,
      habits.reduce((acc, h) => acc + Math.min(Number(h.streak) || 0, 7), 0)
    )
    consistencyRate = Math.min(100, Math.round((estimatedCheckins / maxPossibleCheckins) * 100))
    consistencySubtitle = `${consistencyRate}% across last 7 days`
  } else if (todos.length > 0) {
    const completedTodos = todos.filter((t) => t.is_completed).length
    consistencyRate = Math.round((completedTodos / todos.length) * 100)
    consistencySubtitle = `${completedTodos} of ${todos.length} todos completed`
  }

  // 3. COMPLETED ACTIONS: Completed todos + total recorded habit completions
  const completedTodosCount = todos.filter((t) => t.is_completed).length
  const pendingTodosCount = todos.filter((t) => !t.is_completed).length
  const habitCheckinsCount = habits.reduce((acc, h) => {
    const datesCount = Array.isArray(h.completed_dates) ? h.completed_dates.length : 0
    return acc + Math.max(datesCount, Number(h.streak) || 0)
  }, 0)
  const totalCompletedActions = completedTodosCount + habitCheckinsCount

  let actionsSubtitle = "Across habits & daily todos"
  if (totalCompletedActions === 0) {
    actionsSubtitle = "Complete a habit or todo to start"
  } else if (completedTodosCount > 0 && habitCheckinsCount > 0) {
    actionsSubtitle = `${completedTodosCount} todo${completedTodosCount === 1 ? "" : "s"} & ${habitCheckinsCount} check-in${habitCheckinsCount === 1 ? "" : "s"}`
  } else if (habitCheckinsCount > 0) {
    actionsSubtitle = `${habitCheckinsCount} habit check-in${habitCheckinsCount === 1 ? "" : "s"} logged`
  } else {
    actionsSubtitle = `${completedTodosCount} of ${todos.length} todo${todos.length === 1 ? "" : "s"} completed`
  }

  // 4. ACTIVE FOCUS: Roadmap Journey Phase based on actual streak
  let activeFocusPhase = "PHASE 1"
  let activeFocusSubtitle = "Foundation & Commitment (Days 1–7)"
  if (maxStreak >= 67) {
    activeFocusPhase = "PHASE 4"
    activeFocusSubtitle = "Mastery & Compounding (Day 67+)"
  } else if (maxStreak >= 31) {
    activeFocusPhase = "PHASE 3"
    activeFocusSubtitle = "Automated Identity (Days 31–66)"
  } else if (maxStreak >= 8) {
    activeFocusPhase = "PHASE 2"
    activeFocusSubtitle = "Crucible & Momentum (Days 8–30)"
  }

  // Daily quote selection
  const dayOfYear = getDayOfYear(now)
  const dailyQuote =
    quoteItems && quoteItems.length > 0
      ? quoteItems[dayOfYear % quoteItems.length] || quoteItems[0]
      : {
          quote: "Stay consistent, be strong.",
          author: "Day One",
          image: "",
        }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-bernoru tracking-tight">
            WELCOME, {userName.toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {formattedDate} &bull; Stay Consistent, Be Strong.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Streak */}
        <div className="rounded-xl border bg-card/80 backdrop-blur-md p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Current Streak</span>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-bernoru">
            {maxStreak} {maxStreak === 1 ? "DAY" : "DAYS"}
          </div>
          <p className="text-xs text-muted-foreground">{streakSubtitle}</p>
        </div>

        {/* Consistency */}
        <div className="rounded-xl border bg-card/80 backdrop-blur-md p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Consistency Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-bernoru">{consistencyRate}%</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {consistencySubtitle}
          </p>
        </div>

        {/* Completed Actions */}
        <div className="rounded-xl border bg-card/80 backdrop-blur-md p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Actions</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-bernoru">{totalCompletedActions}</div>
          <p className="text-xs text-muted-foreground">{actionsSubtitle}</p>
        </div>

        {/* Active Focus */}
        <div className="rounded-xl border bg-card/80 backdrop-blur-md p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Active Focus</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-bernoru">{activeFocusPhase}</div>
          <p className="text-xs text-muted-foreground">{activeFocusSubtitle}</p>
        </div>
      </div>

      {/* Main Content Rows */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quote of the Day */}
        <div className="md:col-span-2 rounded-xl border bg-card/80 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500 mb-3">
              <Sparkles className="h-4 w-4" /> Quote of the Day
            </div>
            <blockquote className="text-xl sm:text-2xl font-signika italic text-foreground leading-snug">
              &ldquo;{dailyQuote?.quote}&rdquo;
            </blockquote>
          </div>
          <div className="mt-6 flex items-center justify-between pt-4 border-t">
            <span className="text-sm font-semibold tracking-wide">— {dailyQuote?.author}</span>
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all quotes &rarr;
            </Link>
          </div>
        </div>

        {/* Account Summary */}
        <div className="rounded-xl border bg-card/80 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              <User className="h-4 w-4" /> Profile Details
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Email</span>
                <span className="font-medium text-foreground break-all">{user?.email}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">User ID</span>
                <span className="font-mono text-xs text-muted-foreground break-all">{user?.id}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Session
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t mt-4 space-y-2">
            <Link
              href="/habits"
              className="text-xs font-medium text-primary hover:underline flex items-center justify-between"
            >
              <span>Track My Habits</span>
              <span>&rarr;</span>
            </Link>
            <Link
              href="/todos"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-between"
            >
              <span>Manage Daily Todos</span>
              <span>&rarr;</span>
            </Link>
            <Link
              href="/roadmap"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-between"
            >
              <span>Explore Roadmap</span>
              <span>&rarr;</span>
            </Link>
            <Link
              href="/calendar"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-between"
            >
              <span>Activity Calendar</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Overview: Habits & Todos Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Habits Summary */}
        <div className="rounded-xl border bg-card/80 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Today&apos;s Habits
                </h2>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {completedTodayHabits} of {totalHabits} done
              </span>
            </div>

            {habits.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  No habits tracked yet. Define your non-negotiables to begin building momentum.
                </p>
                <Link
                  href="/habits"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" /> Create First Habit
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {habits.slice(0, 4).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {h.completed_today ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={`text-sm truncate ${
                          h.completed_today ? "line-through text-muted-foreground" : "font-medium text-foreground"
                        }`}
                      >
                        {h.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        {h.streak}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {totalHabits} total habit{totalHabits === 1 ? "" : "s"}
            </span>
            <Link
              href="/habits"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage all habits</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Daily Todos Summary */}
        <div className="rounded-xl border bg-card/80 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Daily Action Items
                </h2>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                {pendingTodosCount} pending
              </span>
            </div>

            {todos.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your daily todo list is clear. Add tasks to keep your day focused.
                </p>
                <Link
                  href="/todos"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" /> Add First Todo
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todos.slice(0, 4).map((t) => {
                  const timing = getTodoTimingStatus(t.created_at, t.completed_at, t.is_completed)
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {t.is_completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-sm truncate ${
                              t.is_completed ? "line-through text-muted-foreground" : "font-medium text-foreground"
                            }`}
                          >
                            {t.title}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {timing.createdFormatted && (
                              <span
                                suppressHydrationWarning
                                className="text-[10px] text-muted-foreground font-mono flex items-center gap-1"
                              >
                                <Clock className="h-2.5 w-2.5" />
                                Created {timing.createdFormatted}
                              </span>
                            )}
                            {t.is_completed && timing.completedFormatted && (
                              <span
                                suppressHydrationWarning
                                className="text-[10px] text-muted-foreground font-mono flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                Done {timing.completedFormatted}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.is_completed ? (
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1",
                              timing.status === "okay"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            )}
                          >
                            {timing.status === "okay" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {timing.badgeLabel}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1",
                              timing.status === "today"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {timing.status === "today" ? "Today" : "Overdue"}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {completedTodosCount} of {todos.length} completed
            </span>
            <Link
              href="/todos"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage all todos</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}