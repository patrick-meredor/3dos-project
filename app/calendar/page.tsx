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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-bernoru tracking-tight">
            ACTIVITY CALENDAR
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> Have I actually been consistent? &bull; Visualizing daily discipline and compounding momentum.
          </p>
        </div>
      </div>

      {/* Main GitHub-style Activity Calendar */}
      <ActivityCalendar habits={habits} />
    </div>
  )
}
