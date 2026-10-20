import { getJournalEntries } from "@/app/journal/action"
import { JournalView } from "@/components/journal-view"

export default async function JournalPage() {
  const { entries, error, tableMissing } = await getJournalEntries()

  return (
    <JournalView
      initialEntries={entries}
      tableMissing={tableMissing}
      dbError={error}
    />
  )
}
