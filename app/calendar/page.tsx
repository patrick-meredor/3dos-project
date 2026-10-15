import { getHabits } from "@/app/habits/action"
import { ActivityCalendar } from "@/components/activity-calendar"
import { Calendar } from "lucide-react"

export const metadata = {
  title: "Activity & History | Day One",
  description: "Track your daily consistency, habit streaks, and monthly contribution calendar.",
}

export default async function CalendarPage() {
  const { habits } = await getHabits()

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pb-1 sm:pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-bernoru tracking-tight">
            ACTIVITY CALENDAR
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
            <span>Have I actually been consistent?</span>
            <span className="hidden xs:inline">&bull;</span>
            <span>Visualizing daily discipline and compounding momentum.</span>
          </p>
        </div>
      </div>

      {/* Main GitHub-style Activity Calendar */}
      <ActivityCalendar habits={habits} />
    </div>
  )
}
