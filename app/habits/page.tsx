import { getHabits } from "@/app/habits/action"
import { HabitsView } from "@/components/habits-view"

export default async function HabitsPage() {
  const { habits, error, tableMissing } = await getHabits()

  return (
    <HabitsView
      initialHabits={habits}
      tableMissing={tableMissing}
      dbError={error}
    />
  )
}
