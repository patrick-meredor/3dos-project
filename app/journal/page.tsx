import { getJournalEntries, getJournalDraft } from "@/app/journal/action"
import { JournalView } from "@/components/journal-view"
import { createClient } from "@/lib/server"

export default async function JournalPage() {
  const supabase = await createClient()
  const [
    { data: { user } },
    { entries, error, tableMissing },
    { draft: initialDraft },
  ] = await Promise.all([
    supabase.auth.getUser(),
    getJournalEntries(),
    getJournalDraft(),
  ])

  return (
    <JournalView
      initialEntries={entries}
      initialDraft={initialDraft}
      userId={user?.id}
      tableMissing={tableMissing}
      dbError={error}
    />
  )
}
