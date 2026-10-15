"use client"

import { useState, useMemo } from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getLocalDateString } from "@/lib/habits"
import type { HabitItem } from "@/app/habits/action"

interface ActivityCalendarProps {
  habits: HabitItem[]
}

interface DayCellData {
  dayNumber: number
  dateStr: string
  dayOfWeek: number
  isToday: boolean
  isFuture: boolean
  isPastOrToday: boolean
  completedCount: number
  totalTracked: number
  completedHabitTitles: string[]
  intensity: 0 | 1 | 2 | 3
}

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"]
const WEEK_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function ActivityCalendar({ habits }: ActivityCalendarProps) {
  // Navigation month state (defaults to today's month)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedHabitId, setSelectedHabitId] = useState<string>("all")
  const [hoveredDay, setHoveredDay] = useState<DayCellData | null>(null)

  // Current real date
  const now = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => getLocalDateString(now), [now])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleString("en-US", { month: "long" })

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth()

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
    setHoveredDay(null)
  }

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
    setHoveredDay(null)
  }

  const handleTodayMonth = () => {
    setViewDate(new Date())
    setHoveredDay(null)
  }

  // Active habits to evaluate based on filter
  const filteredHabits = useMemo(() => {
    if (selectedHabitId === "all") return habits
    return habits.filter((h) => h.id === selectedHabitId)
  }, [habits, selectedHabitId])

  // Calendar calculations
  const { days, offset, stats } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sun, 1 = Mon ...
    const offset = (firstDayOfWeek + 6) % 7 // Monday = 0, Sunday = 6

    const totalTrackedHabits = filteredHabits.length

    const cells: DayCellData[] = []
    let completedDaysCount = 0
    let totalCheckinsInMonth = 0

    // Elapsed days in this month
    let elapsedDays = daysInMonth
    if (isCurrentMonth) {
      elapsedDays = now.getDate()
    } else if (viewDate > now) {
      elapsedDays = 0
    }

    let runningStreak = 0
    let longestStreakInMonth = 0

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, "0")
      const dayStr = String(d).padStart(2, "0")
      const dateStr = `${year}-${monthStr}-${dayStr}`

      const dayDate = new Date(year, month, d)
      // Strip time for exact date comparison
      const todayDateClean = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayDateClean = new Date(year, month, d)

      const isToday = dateStr === todayStr
      const isFuture = dayDateClean > todayDateClean
      const isPastOrToday = !isFuture

      // Check completions on this date
      const completedTitles: string[] = []
      filteredHabits.forEach((h) => {
        const dates = Array.isArray(h.completed_dates) ? h.completed_dates : []
        if (dates.includes(dateStr) || (isToday && h.completed_today)) {
          completedTitles.push(h.title)
        }
      })

      const completedCount = completedTitles.length
      totalCheckinsInMonth += completedCount

      let intensity: 0 | 1 | 2 | 3 = 0
      if (!isFuture && completedCount > 0) {
        if (totalTrackedHabits <= 1) {
          intensity = 3
        } else {
          const ratio = completedCount / totalTrackedHabits
          if (ratio >= 0.8) intensity = 3
          else if (ratio >= 0.4) intensity = 2
          else intensity = 1
        }
      }

      if (isPastOrToday && completedCount > 0) {
        completedDaysCount++
        runningStreak++
        if (runningStreak > longestStreakInMonth) {
          longestStreakInMonth = runningStreak
        }
      } else if (isPastOrToday) {
        runningStreak = 0
      }

      cells.push({
        dayNumber: d,
        dateStr,
        dayOfWeek: (offset + d - 1) % 7,
        isToday,
        isFuture,
        isPastOrToday,
        completedCount,
        totalTracked: totalTrackedHabits,
        completedHabitTitles: completedTitles,
        intensity,
      })
    }

    const completionRate =
      elapsedDays > 0 ? Math.round((completedDaysCount / elapsedDays) * 100) : 0

    // Compare with overall best habit streak
    const bestHabitStreak =
      filteredHabits.length > 0 ? Math.max(...filteredHabits.map((h) => Number(h.streak) || 0)) : 0
    const bestStreak = Math.max(longestStreakInMonth, isCurrentMonth ? bestHabitStreak : 0)

    return {
      days: cells,
      offset,
      stats: {
        completedDays: completedDaysCount,
        elapsedDays,
        daysInMonth,
        completionRate,
        bestStreak,
        totalCheckins: totalCheckinsInMonth,
      },
    }
  }, [year, month, filteredHabits, isCurrentMonth, now, todayStr, viewDate])

  return (
    <div className="rounded-xl border bg-card/80 backdrop-blur-md p-3.5 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
      {/* Header with Title and Month Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-orange-500 mb-1">
            <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Activity &bull; Calendar / History
          </div>
          <h2 className="text-lg sm:text-2xl font-bold font-bernoru tracking-tight">
            HAVE I ACTUALLY BEEN CONSISTENT?
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualizing your daily discipline and compounding habit momentum
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-muted/60 rounded-lg p-0.5 sm:p-1 border flex-1 sm:flex-initial justify-between sm:justify-start">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 sm:px-3 text-xs font-bold font-bernoru uppercase tracking-wider min-w-[105px] sm:min-w-[125px] text-center">
              {monthName} {year}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!isCurrentMonth && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleTodayMonth}
              className="text-xs h-8 sm:h-9 px-2.5 sm:px-3 shrink-0"
            >
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Habit Filter Selection Pills (if user has habits) */}
      {habits.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1 sm:flex-wrap">
          <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mr-1 shrink-0">Filter:</span>
          <button
            type="button"
            onClick={() => setSelectedHabitId("all")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0",
              selectedHabitId === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All Habits ({habits.length})
          </button>
          {habits.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setSelectedHabitId(h.id)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer truncate max-w-[140px] sm:max-w-[170px] shrink-0",
                selectedHabitId === h.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {h.title}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid + Stats Summary Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left: GitHub-style Calendar Grid */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="rounded-xl border bg-background/40 p-2.5 sm:p-5">
            {/* Month Label Header */}
            <div className="text-center font-bernoru font-bold text-xs sm:text-sm tracking-wider uppercase text-muted-foreground mb-3 sm:mb-4">
              {monthName} {year}
            </div>

            {/* Weekday Labels: M T W T F S S */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2.5 mb-2 sm:mb-2.5 text-center">
              {WEEK_DAYS.map((day, idx) => (
                <span
                  key={idx}
                  className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase font-mono tracking-wider"
                  title={WEEK_DAY_NAMES[idx]}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
              {/* Empty leading offset days */}
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`offset-${i}`} className="aspect-square" />
              ))}

              {/* Month Day Cells */}
              {days.map((cell) => {
                const isHovered = hoveredDay?.dateStr === cell.dateStr

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onMouseEnter={() => setHoveredDay(cell)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => setHoveredDay(cell)}
                    className={cn(
                      "aspect-square rounded-md sm:rounded-lg border transition-all duration-200 relative flex flex-col items-center justify-center p-0.5 sm:p-1 cursor-pointer select-none min-h-[32px] sm:min-h-[42px]",
                      // Today outline
                      cell.isToday && "ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background z-10",
                      // Hovered state
                      isHovered && "scale-105 shadow-md z-20",
                      // Colors based on intensity & state
                      cell.isFuture
                        ? "bg-muted/10 border-dashed border-border/40 text-muted-foreground/30 cursor-default"
                        : cell.intensity === 3
                        ? "bg-orange-500 border-orange-500 text-white font-bold shadow-sm shadow-orange-500/30"
                        : cell.intensity === 2
                        ? "bg-orange-500/60 border-orange-500/70 text-white font-semibold"
                        : cell.intensity === 1
                        ? "bg-orange-500/25 border-orange-500/40 text-orange-950 dark:text-orange-200 font-medium"
                        : "bg-muted/30 border-border/60 text-muted-foreground/70 hover:border-foreground/30"
                    )}
                    aria-label={`${cell.dateStr}: ${cell.completedCount} completed`}
                  >
                    <span className="text-[10px] sm:text-xs font-mono">{cell.dayNumber}</span>
                  </button>
                )
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t text-[10px] sm:text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span>Less</span>
                <div className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-xs sm:rounded-sm bg-muted/30 border border-border/60" title="0 habits" />
                <div className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-xs sm:rounded-sm bg-orange-500/25 border border-orange-500/40" title="Low activity" />
                <div className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-xs sm:rounded-sm bg-orange-500/60 border border-orange-500/70" title="Medium activity" />
                <div className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-xs sm:rounded-sm bg-orange-500 border border-orange-500 shadow-xs" title="All habits completed" />
                <span>More</span>
              </div>
              <span className="text-muted-foreground/80">
                Hover or tap any date to inspect completions
              </span>
            </div>
          </div>

          {/* Interactive Day Details Banner */}
          {hoveredDay ? (
            <div className="rounded-lg border bg-background/70 backdrop-blur-xs p-3 sm:p-3.5 flex items-center justify-between text-xs animate-in fade-in duration-150">
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <span>{new Date(hoveredDay.dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</span>
                  {hoveredDay.isToday && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-primary text-primary-foreground">
                      TODAY
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {hoveredDay.isFuture ? (
                    "Future date"
                  ) : hoveredDay.completedCount > 0 ? (
                    <span>
                      {hoveredDay.completedCount} of {hoveredDay.totalTracked} habit{hoveredDay.totalTracked === 1 ? "" : "s"} completed:{" "}
                      <span className="text-foreground font-medium">
                        {hoveredDay.completedHabitTitles.join(", ")}
                      </span>
                    </span>
                  ) : (
                    "No habit check-ins recorded"
                  )}
                </div>
              </div>
              {hoveredDay.completedCount > 0 && (
                <div className="p-1 sm:p-1.5 rounded-md bg-orange-500/10 text-orange-500 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/10 p-2.5 sm:p-3 text-center text-xs text-muted-foreground">
              Tip: Hover or tap past calendar squares to view which habits were checked in that day.
            </div>
          )}
        </div>

        {/* Right: Monthly Statistics Overview */}
        <div className="rounded-xl border bg-background/50 p-3.5 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b">
              <div>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  MONTHLY METRICS
                </span>
                <h3 className="text-base sm:text-lg font-bold font-bernoru tracking-tight text-foreground">
                  {monthName.toUpperCase()}
                </h3>
              </div>
              <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                {stats.elapsedDays}/{stats.daysInMonth} Days
              </span>
            </div>

            <div className="divide-y divide-border/60 text-xs sm:text-sm">
              <div className="py-2.5 sm:py-3.5 flex items-center justify-between">
                <span className="text-muted-foreground">Completed days</span>
                <span className="font-bold font-bernoru text-base sm:text-lg text-foreground">
                  {stats.completedDays}
                </span>
              </div>

              <div className="py-2.5 sm:py-3.5 flex items-center justify-between">
                <span className="text-muted-foreground">Completion rate</span>
                <span className="font-bold font-bernoru text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                  {stats.completionRate}%
                </span>
              </div>

              <div className="py-2.5 sm:py-3.5 flex items-center justify-between">
                <span className="text-muted-foreground">Best streak</span>
                <span className="font-bold font-bernoru text-base sm:text-lg text-orange-500 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {stats.bestStreak} {stats.bestStreak === 1 ? "day" : "days"}
                </span>
              </div>

              <div className="py-2.5 sm:py-3.5 flex items-center justify-between">
                <span className="text-muted-foreground">Total check-ins</span>
                <span className="font-bold font-bernoru text-base sm:text-lg text-foreground">
                  {stats.totalCheckins}
                </span>
              </div>
            </div>
          </div>

          {/* Motivational Consistency Feedback */}
          <div className="p-3.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-600 dark:text-orange-400 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Consistency Status</span>
            </div>
            <p className="text-[11px] text-foreground/80 leading-relaxed">
              {stats.completionRate >= 80 ? (
                <>Exceptional consistency! You are compounding real discipline day by day.</>
              ) : stats.completionRate >= 50 ? (
                <>Solid discipline. Keep your daily check-ins going to push past 80%.</>
              ) : stats.completedDays > 0 ? (
                <>Building momentum. Every day you check in strengthens the habit chain.</>
              ) : (
                <>Every day is Day One. Complete your first habit today to start your chain!</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
