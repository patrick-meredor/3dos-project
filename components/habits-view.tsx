"use client"

import { useState, useTransition } from "react"
import {
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Target,
  Sparkles,
  Calendar,
  Database,
  Copy,
  CheckCheck,
  Sun,
  Brain,
  Heart,
  Moon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  addHabit,
  toggleHabitToday,
  deleteHabit,
  updateHabit,
  type HabitItem
} from "@/app/habits/action"

interface HabitsViewProps {
  initialHabits: HabitItem[]
  tableMissing?: boolean
  dbError?: string
}

const CATEGORIES = [
  { name: "Morning", icon: Sun, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { name: "Mindset", icon: Brain, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { name: "Health", icon: Heart, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Evening", icon: Moon, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
]

export function HabitsView({ initialHabits, tableMissing = false, dbError }: HabitsViewProps) {
  const [habits, setHabits] = useState<HabitItem[]>(initialHabits)
  const [newTitle, setNewTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Morning")
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [copiedSql, setCopiedSql] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(dbError ?? null)

  const sqlSnippet = `-- Run this in your Supabase SQL Editor:
create table if not exists public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  category text default 'Morning' not null,
  streak integer default 0 not null,
  completed_today boolean default false not null,
  completed_dates jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.habits enable row level security;

create policy "Users can manage their own habits"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  // Handle Add Habit
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const tempId = `temp-${Date.now()}`
    const titleToAdd = newTitle.trim()
    const categoryToAdd = selectedCategory
    setNewTitle("")
    setActionError(null)

    // Optimistic insert
    const optimisticHabit: HabitItem = {
      id: tempId,
      user_id: "",
      title: titleToAdd,
      category: categoryToAdd,
      streak: 0,
      completed_today: false,
      completed_dates: [],
      created_at: new Date().toISOString(),
    }
    setHabits((prev) => [optimisticHabit, ...prev])

    startTransition(async () => {
      const res = await addHabit({ title: titleToAdd, category: categoryToAdd })
      if (!res.success) {
        setActionError(res.error || "Failed to add habit.")
        setHabits((prev) => prev.filter((h) => h.id !== tempId))
      } else if (res.habit) {
        setHabits((prev) =>
          prev.map((h) => (h.id === tempId ? res.habit! : h))
        )
      }
    })
  }

  // Handle Toggle Today
  const handleToggleToday = (habit: HabitItem) => {
    const nextStatus = !habit.completed_today
    const nextStreak = nextStatus ? habit.streak + 1 : Math.max(0, habit.streak - 1)
    const todayStr = new Date().toISOString().split('T')[0]

    let updatedDates = [...habit.completed_dates]
    if (nextStatus) {
      if (!updatedDates.includes(todayStr)) updatedDates.push(todayStr)
    } else {
      updatedDates = updatedDates.filter((d) => d !== todayStr)
    }

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? { ...h, completed_today: nextStatus, streak: nextStreak, completed_dates: updatedDates }
          : h
      )
    )

    startTransition(async () => {
      const res = await toggleHabitToday(habit.id, habit.completed_today, habit.streak, habit.completed_dates)
      if (!res.success) {
        setActionError(res.error || "Failed to update habit status.")
        setHabits((prev) =>
          prev.map((h) => (h.id === habit.id ? habit : h))
        )
      }
    })
  }

  // Edit Habit
  const startEdit = (habit: HabitItem) => {
    setEditingId(habit.id)
    setEditTitle(habit.title)
  }

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }

    const updatedTitle = editTitle.trim()
    const original = habits.find((h) => h.id === id)
    setEditingId(null)

    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, title: updatedTitle } : h))
    )

    startTransition(async () => {
      const res = await updateHabit(id, { title: updatedTitle })
      if (!res.success) {
        setActionError(res.error || "Failed to update habit.")
        if (original) {
          setHabits((prev) => prev.map((h) => (h.id === id ? original : h)))
        }
      }
    })
  }

  // Delete Habit
  const handleDelete = (id: string) => {
    const original = habits.find((h) => h.id === id)
    setHabits((prev) => prev.filter((h) => h.id !== id))

    startTransition(async () => {
      const res = await deleteHabit(id)
      if (!res.success) {
        setActionError(res.error || "Failed to delete habit.")
        if (original) {
          setHabits((prev) => [original, ...prev])
        }
      }
    })
  }

  // Filtered habits
  const filteredHabits = habits.filter((h) => {
    if (activeCategoryFilter === "all") return true
    return h.category.toLowerCase() === activeCategoryFilter.toLowerCase()
  })

  // Summary Metrics
  const totalCompletedToday = habits.filter((h) => h.completed_today).length
  const totalHabits = habits.length
  const overallConsistency = totalHabits > 0 ? Math.round((totalCompletedToday / totalHabits) * 100) : 0
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0)

  // Last 7 days helper for streak dots
  const getPast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        dayName: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        dateStr: d.toISOString().split("T")[0],
        isToday: i === 0,
      })
    }
    return days
  }
  const past7Days = getPast7Days()

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Table Missing Warning / Helper */}
      {tableMissing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
              <Database className="h-4 w-4" />
              <span>Supabase &lsquo;habits&rsquo; Table Setup Required</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySql}
              className="gap-1.5 text-xs h-7"
            >
              {copiedSql ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedSql ? "Copied!" : "Copy SQL"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The table <code className="font-mono bg-muted px-1 py-0.5 rounded">public.habits</code> does not exist yet. You are currently viewing starter habits. Copy this schema, run it in your <strong>Supabase Dashboard &rarr; SQL Editor</strong>, and your habits will save permanently!
          </p>
          <pre className="p-3 rounded-lg bg-background/80 border text-[11px] font-mono text-muted-foreground overflow-x-auto">
            {sqlSnippet}
          </pre>
        </div>
      )}

      {/* Action Error Notification */}
      {actionError && !tableMissing && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive font-medium flex items-center justify-between">
          <span>{actionError}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setActionError(null)}
            className="text-destructive hover:bg-destructive/15"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Hero Header & Metrics */}
      <div className="flex flex-col gap-4 pb-2 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-bernoru tracking-tight">
              MY HABITS
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span>Build unbroken streaks and master your daily non-negotiables.</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold flex items-center gap-1.5 border border-orange-500/20">
              <Flame className="h-3.5 w-3.5 fill-orange-500" />
              <span>{maxStreak}d Best Streak</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              {totalCompletedToday}/{totalHabits} Done Today
            </span>
          </div>
        </div>

        {/* 7-Day Week Strip */}
        <div className="flex items-center justify-between bg-card/60 border rounded-xl p-3 sm:p-4 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Calendar className="h-4 w-4 text-orange-500" />
            <span className="hidden sm:inline">This Week&apos;s Momentum:</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {past7Days.map((day) => (
              <div
                key={day.dateStr}
                className={cn(
                  "flex flex-col items-center justify-center size-8 sm:size-9 rounded-lg border transition-all text-center",
                  day.isToday
                    ? "border-orange-500 bg-orange-500/15 font-bold text-orange-600 dark:text-orange-400 shadow-sm"
                    : "border-border/60 bg-muted/40 text-muted-foreground"
                )}
              >
                <span className="text-[10px] uppercase">{day.dayName}</span>
                <span className="text-[11px] font-semibold">
                  {day.dateStr.split("-")[2]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add New Habit Form */}
      <form onSubmit={handleAddHabit} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add habit (e.g. 10m Meditation, Read 10 Pages, Cold Shower)..."
            className="flex-1 h-10 px-3.5 text-sm"
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !newTitle.trim()} className="gap-1.5 h-10 px-4 shrink-0">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Add Habit</span>
          </Button>
        </div>

        {/* Category Picker */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground mr-1 text-[11px] uppercase tracking-wider font-semibold">Category:</span>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.name
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/50 text-muted-foreground border-border/60 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.name}</span>
              </button>
            )
          })}
        </div>
      </form>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b text-xs">
        <Button
          variant={activeCategoryFilter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveCategoryFilter("all")}
          className="text-xs h-7"
        >
          All ({habits.length})
        </Button>
        {CATEGORIES.map((cat) => {
          const count = habits.filter((h) => h.category.toLowerCase() === cat.name.toLowerCase()).length
          return (
            <Button
              key={cat.name}
              variant={activeCategoryFilter === cat.name.toLowerCase() ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveCategoryFilter(cat.name.toLowerCase())}
              className="text-xs h-7 gap-1.5"
            >
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </Button>
          )
        })}
      </div>

      {/* Habit Cards Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {filteredHabits.length === 0 ? (
          <div className="sm:col-span-2 rounded-2xl border border-dashed p-10 text-center space-y-3 bg-muted/20">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-muted text-muted-foreground">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold font-bernoru tracking-wide">
                No habits in this category
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Add a habit above to start tracking your daily progress and building momentum.
              </p>
            </div>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isEditing = editingId === habit.id
            const catConfig = CATEGORIES.find(
              (c) => c.name.toLowerCase() === habit.category.toLowerCase()
            ) ?? CATEGORIES[0]
            const CatIcon = catConfig.icon

            return (
              <div
                key={habit.id}
                className={cn(
                  "group relative flex flex-col justify-between p-4 rounded-xl border bg-card/85 backdrop-blur-sm shadow-sm transition-all hover:shadow-md",
                  habit.completed_today && "border-orange-500/40 bg-card/95 ring-1 ring-orange-500/15"
                )}
              >
                {/* Top Row: Category Pill & Options */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                      catConfig.color
                    )}
                  >
                    <CatIcon className="h-3 w-3" />
                    <span>{habit.category}</span>
                  </span>

                  {/* Edit/Delete Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => startEdit(habit)}
                        title="Edit habit"
                        className="size-6 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(habit.id)}
                        title="Delete habit"
                        className="size-6 text-destructive hover:bg-destructive/15"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Middle: Title & Checkbox */}
                <div className="flex items-start gap-3 mb-4 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleToday(habit)}
                    className="shrink-0 mt-0.5 cursor-pointer text-muted-foreground hover:text-orange-500 transition-colors"
                    aria-label={habit.completed_today ? "Completed today" : "Mark completed today"}
                  >
                    {habit.completed_today ? (
                      <CheckCircle2 className="h-6 w-6 text-orange-500 fill-orange-500/20" />
                    ) : (
                      <Circle className="h-6 w-6 hover:text-orange-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(habit.id)
                            if (e.key === "Escape") setEditingId(null)
                          }}
                          autoFocus
                          className="h-8 text-sm"
                        />
                        <Button
                          size="icon-xs"
                          variant="default"
                          onClick={() => saveEdit(habit.id)}
                          className="size-7"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="size-7"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <h3
                        onClick={() => handleToggleToday(habit)}
                        className={cn(
                          "text-base font-bold font-bernoru tracking-wide cursor-pointer transition-colors leading-snug",
                          habit.completed_today ? "text-foreground" : "text-foreground/90"
                        )}
                      >
                        {habit.title}
                      </h3>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Streak & 7-Day History Mini-Dots */}
                <div className="flex items-center justify-between pt-3 border-t text-xs">
                  <div className="flex items-center gap-1.5">
                    <Flame
                      className={cn(
                        "h-4 w-4",
                        habit.streak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground"
                      )}
                    />
                    <span className="font-semibold text-foreground font-sans">
                      {habit.streak} {habit.streak === 1 ? "day" : "days"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">streak</span>
                  </div>

                  {/* 7-Day Mini Dots */}
                  <div className="flex items-center gap-1" title="Last 7 days completion">
                    {past7Days.map((d) => {
                      const wasDone = d.isToday
                        ? habit.completed_today
                        : habit.completed_dates.includes(d.dateStr)

                      return (
                        <div
                          key={d.dateStr}
                          className={cn(
                            "size-2 rounded-full transition-all",
                            wasDone
                              ? "bg-orange-500 ring-1 ring-orange-500/40"
                              : "bg-muted-foreground/20"
                          )}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
