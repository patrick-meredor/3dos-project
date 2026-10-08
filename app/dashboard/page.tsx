import { createClient } from "@/lib/server"
import { Flame, CheckCircle, Target, TrendingUp, Sparkles, User, Calendar } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userName = user?.email ? user.email.split("@")[0] : "Hero"
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b">
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
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Current Streak</span>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-bernoru">12 DAYS</div>
          <p className="text-xs text-muted-foreground">+2 days from last week</p>
        </div>

        {/* Consistency */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Consistency Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-bernoru">94%</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">On track this month</p>
        </div>

        {/* Completed Milestones */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Actions</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-bernoru">28</div>
          <p className="text-xs text-muted-foreground">Across all daily habits</p>
        </div>

        {/* Active Focus */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Active Focus</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-bernoru">PHASE 1</div>
          <p className="text-xs text-muted-foreground">Mindset & Routine Building</p>
        </div>
      </div>

      {/* Main Content Rows */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quote of the Day */}
        <div className="md:col-span-2 rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500 mb-3">
              <Sparkles className="h-4 w-4" /> Quote of the Day
            </div>
            <blockquote className="text-xl sm:text-2xl font-signika italic text-foreground leading-snug">
              &ldquo;Similarly we become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.&rdquo;
            </blockquote>
          </div>
          <div className="mt-6 flex items-center justify-between pt-4 border-t">
            <span className="text-sm font-semibold tracking-wide">— Aristotle</span>
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all quotes &rarr;
            </Link>
          </div>
        </div>

        {/* Account Summary */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between">
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
          </div>
        </div>
      </div>
    </div>
  )
}