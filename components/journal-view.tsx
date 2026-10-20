"use client"

import { useState, useTransition, useMemo } from "react"
import {
  PenSquare,
  BookOpen,
  Calendar,
  Sparkles,
  Trash2,
  Edit3,
  Search,
  Heart,
  Brain,
  Lightbulb,
  Mail,
  Copy,
  CheckCheck,
  X,
  Clock,
  Plus,
  Eye,
  Database,
  AlertCircle,
  FileText,
  CalendarDays,
  Flame,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { getLocalDateString } from "@/lib/habits"
import {
  formatJournalDate,
  formatJournalTime,
  getWordCount,
  getReadingTime,
  type JournalEntry,
} from "@/lib/journal"
import {
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from "@/app/journal/action"

interface JournalViewProps {
  initialEntries: JournalEntry[]
  tableMissing?: boolean
  dbError?: string
}

const CATEGORIES = [
  {
    name: "Thoughts",
    icon: Brain,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    activeColor: "bg-blue-500 text-white border-blue-500",
  },
  {
    name: "Letter",
    icon: Mail,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    activeColor: "bg-amber-500 text-white border-amber-500",
  },
  {
    name: "Reflection",
    icon: Sparkles,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    activeColor: "bg-purple-500 text-white border-purple-500",
  },
  {
    name: "Gratitude",
    icon: Heart,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    activeColor: "bg-rose-500 text-white border-rose-500",
  },
  {
    name: "Idea",
    icon: Lightbulb,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    activeColor: "bg-emerald-500 text-white border-emerald-500",
  },
]

export function JournalView({
  initialEntries,
  tableMissing = false,
  dbError,
}: JournalViewProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all")

  // Editor states (New Entry)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [entryDate, setEntryDate] = useState(getLocalDateString())
  const [selectedCategory, setSelectedCategory] = useState("Thoughts")

  // Reading modal state
  const [readingEntry, setReadingEntry] = useState<JournalEntry | null>(null)

  // Editing state
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editCategory, setEditCategory] = useState("Thoughts")

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Feedback & Transitions
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(dbError ?? null)
  const [copiedSql, setCopiedSql] = useState(false)

  const sqlSnippet = `-- Run this in your Supabase SQL Editor:
create table if not exists public.journals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null default '',
  content text not null,
  entry_date date default current_date not null,
  mood text default 'Thoughts' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.journals enable row level security;

create policy "Users can manage their own journals"
  on public.journals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  // Live Metrics
  const metrics = useMemo(() => {
    const totalEntries = entries.length
    const totalWords = entries.reduce(
      (sum, e) => sum + getWordCount(e.content),
      0
    )
    const uniqueDays = new Set(entries.map((e) => e.entry_date)).size

    const now = new Date()
    const currentYearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`
    const thisMonthEntries = entries.filter((e) =>
      e.entry_date.startsWith(currentYearMonth)
    ).length

    return {
      totalEntries,
      totalWords,
      uniqueDays,
      thisMonthEntries,
    }
  }, [entries])

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategoryFilter === "all" ||
        item.mood?.toLowerCase() === selectedCategoryFilter.toLowerCase()

      return matchesSearch && matchesCategory
    })
  }, [entries, searchQuery, selectedCategoryFilter])

  // Handle Save New Entry
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const tempId = `temp-${Date.now()}`
    const contentToSave = content.trim()
    const titleToSave = title.trim()
    const dateToSave = entryDate || getLocalDateString()
    const moodToSave = selectedCategory

    // Reset inputs
    setTitle("")
    setContent("")
    setEntryDate(getLocalDateString())
    setIsEditorOpen(false)
    setActionError(null)

    // Optimistic insert
    const optimisticEntry: JournalEntry = {
      id: tempId,
      user_id: "",
      title: titleToSave,
      content: contentToSave,
      entry_date: dateToSave,
      mood: moodToSave,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setEntries((prev) => [optimisticEntry, ...prev])

    startTransition(async () => {
      const res = await createJournalEntry({
        title: titleToSave,
        content: contentToSave,
        entry_date: dateToSave,
        mood: moodToSave,
      })

      if (!res.success) {
        setEntries((prev) => prev.filter((item) => item.id !== tempId))
        setActionError(res.error || "Failed to save journal entry.")
      } else if (res.entry) {
        setEntries((prev) =>
          prev.map((item) => (item.id === tempId ? res.entry! : item))
        )
      }
    })
  }

  // Handle Start Edit
  const handleStartEdit = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setEditTitle(entry.title)
    setEditContent(entry.content)
    setEditDate(entry.entry_date)
    setEditCategory(entry.mood || "Thoughts")
    if (readingEntry?.id === entry.id) {
      setReadingEntry(null)
    }
  }

  // Handle Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEntry || !editContent.trim()) return

    const id = editingEntry.id
    const prev = { ...editingEntry }
    const updatedTitle = editTitle.trim()
    const updatedContent = editContent.trim()
    const updatedDate = editDate || editingEntry.entry_date
    const updatedMood = editCategory

    // Optimistic update
    setEntries((list) =>
      list.map((item) =>
        item.id === id
          ? {
              ...item,
              title: updatedTitle,
              content: updatedContent,
              entry_date: updatedDate,
              mood: updatedMood,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    )

    setEditingEntry(null)

    startTransition(async () => {
      const res = await updateJournalEntry(id, {
        title: updatedTitle,
        content: updatedContent,
        entry_date: updatedDate,
        mood: updatedMood,
      })

      if (!res.success) {
        setEntries((list) =>
          list.map((item) => (item.id === id ? prev : item))
        )
        setActionError(res.error || "Failed to update entry.")
      }
    })
  }

  // Handle Delete
  const handleDelete = (id: string) => {
    const backup = entries.find((e) => e.id === id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setDeletingId(null)
    if (readingEntry?.id === id) {
      setReadingEntry(null)
    }

    startTransition(async () => {
      const res = await deleteJournalEntry(id)
      if (!res.success && backup) {
        setEntries((prev) => [backup, ...prev])
        setActionError(res.error || "Failed to delete entry.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Top Banner / Table Missing Setup Prompt */}
      {tableMissing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <Database className="size-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground">
                Supabase Database Setup Required
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                The <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">public.journals</code> table
                has not been created yet in your Supabase project. Run this SQL query to initialize your journal table with Row Level Security:
              </p>
              <div className="relative mt-3">
                <pre className="p-3 rounded-lg bg-black/60 text-xs text-zinc-300 font-mono overflow-x-auto max-h-48 border border-white/10">
                  {sqlSnippet}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 h-7 text-xs gap-1.5 shadow-sm"
                  onClick={handleCopySql}
                >
                  {copiedSql ? (
                    <>
                      <CheckCheck className="size-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy SQL
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {actionError && !tableMissing && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => setActionError(null)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Page Title & Stats Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <PenSquare className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">
                Journal
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Capture thoughts, letters, memories, and personal reflections.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setIsEditorOpen((prev) => !prev)
              if (!isEditorOpen) {
                // Focus editor smoothly
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            }}
            className="gap-2 shadow-xs transition-transform active:scale-95"
          >
            {isEditorOpen ? (
              <>
                <X className="size-4" />
                Close Editor
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Write New Entry
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overview Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Entries</span>
            <BookOpen className="size-4 text-primary" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading">{metrics.totalEntries}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Total recorded</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Words</span>
            <FileText className="size-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading">
              {metrics.totalWords.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Written thoughts</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Days Active</span>
            <CalendarDays className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading">{metrics.uniqueDays}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Journaling days</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">This Month</span>
            <Flame className="size-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading">{metrics.thisMonthEntries}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Entries this month</p>
          </div>
        </div>
      </div>

      {/* Expandable New Entry Editor */}
      {isEditorOpen && (
        <div className="rounded-2xl border border-primary/30 bg-card/90 p-5 sm:p-6 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleSaveNew} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <PenSquare className="size-4 text-primary" />
                <span className="font-semibold text-base">Write a New Entry</span>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="h-8 w-auto text-xs py-0 px-2 cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setEntryDate(getLocalDateString())}
                  className="text-xs"
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Category / Mood Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Type:</span>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isSelected = selectedCategory === cat.name
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer",
                      isSelected
                        ? cat.activeColor
                        : "border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3" />
                    {cat.name}
                  </button>
                )
              })}
            </div>

            {/* Title Input */}
            <div>
              <Input
                placeholder="Title or Topic (e.g. Letter to My Future Self, Morning Thoughts...)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-medium h-10 placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Content Textarea */}
            <div className="relative">
              <Textarea
                placeholder="Write your text, paragraphs, letters, or thoughts here... Pour your heart out."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[220px] font-sans text-base leading-relaxed p-4"
              />
            </div>

            {/* Writing Metrics & Actions Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{getWordCount(content)} words</span>
                <span>•</span>
                <span>{content.length} characters</span>
                <span>•</span>
                <span>{getReadingTime(content)}</span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditorOpen(false)
                    setTitle("")
                    setContent("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim() || isPending}
                  className="gap-2 px-4 shadow-sm"
                >
                  {isPending ? (
                    <>
                      <div className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      Save Entry
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 p-2 sm:p-3 rounded-xl border border-border/50 backdrop-blur-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search entries by title or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter("all")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
              selectedCategoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 hover:bg-muted text-muted-foreground"
            )}
          >
            All ({entries.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = entries.filter(
              (e) => e.mood?.toLowerCase() === cat.name.toLowerCase()
            ).length
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategoryFilter(cat.name)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer",
                  selectedCategoryFilter.toLowerCase() === cat.name.toLowerCase()
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground"
                )}
              >
                {cat.name} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Entries List / Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/60">
            <BookOpen className="size-6 text-muted-foreground" />
          </div>
          <div className="max-w-sm">
            <h3 className="font-semibold text-lg text-foreground">
              {searchQuery || selectedCategoryFilter !== "all"
                ? "No matching entries found"
                : "No journal entries yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || selectedCategoryFilter !== "all"
                ? "Try adjusting your search query or category filter."
                : "Start documenting your story, a personal letter, ideas, or today's memories."}
            </p>
          </div>
          {!searchQuery && selectedCategoryFilter === "all" && (
            <Button
              onClick={() => setIsEditorOpen(true)}
              size="sm"
              className="mt-2 gap-1.5"
            >
              <Plus className="size-4" />
              Write First Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const dateInfo = formatJournalDate(entry.entry_date)
            const timeStr = formatJournalTime(entry.created_at)
            const words = getWordCount(entry.content)
            const readTime = getReadingTime(entry.content)

            const categoryConfig =
              CATEGORIES.find(
                (c) => c.name.toLowerCase() === (entry.mood || "").toLowerCase()
              ) || CATEGORIES[0]
            const CategoryIcon = categoryConfig.icon

            const isConfirmingDelete = deletingId === entry.id

            return (
              <div
                key={entry.id}
                className="group relative rounded-2xl border border-border/70 bg-card/70 p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md backdrop-blur-xs flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Date & Mood Tag */}
                  <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {dateInfo.displayDate}
                          </span>
                          {dateInfo.isToday && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              Today
                            </span>
                          )}
                        </div>
                        {timeStr && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <Clock className="size-3" />
                            <span>{timeStr}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0",
                        categoryConfig.color
                      )}
                    >
                      <CategoryIcon className="size-3" />
                      <span>{entry.mood || "Thoughts"}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-lg mt-3 text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {entry.title || "Untitled Entry"}
                  </h3>

                  {/* Body Content Preview */}
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-4 leading-relaxed font-sans whitespace-pre-line">
                    {entry.content}
                  </p>
                </div>

                {/* Card Footer: Word count & Quick Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{words} words</span>
                    <span>•</span>
                    <span>{readTime}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Read Full Button */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="Read Full Entry"
                      onClick={() => setReadingEntry(entry)}
                      className="hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="size-3.5" />
                    </Button>

                    {/* Edit Button */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="Edit Entry"
                      onClick={() => handleStartEdit(entry)}
                      className="hover:text-blue-500 hover:bg-blue-500/10"
                    >
                      <Edit3 className="size-3.5" />
                    </Button>

                    {/* Delete Action with confirm */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 bg-destructive/10 p-1 rounded border border-destructive/20 animate-in fade-in">
                        <Button
                          variant="destructive"
                          size="xs"
                          className="h-6 text-[10px] px-1.5"
                          onClick={() => handleDelete(entry.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-6 text-[10px] px-1"
                          onClick={() => setDeletingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title="Delete Entry"
                        onClick={() => setDeletingId(entry.id)}
                        className="hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reader Modal (Immersive Full Letter/Journal View) */}
      {readingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl overflow-y-auto flex flex-col gap-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">
                    {formatJournalDate(readingEntry.entry_date).displayDate}
                  </span>
                  {readingEntry.mood && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground border">
                      {readingEntry.mood}
                    </span>
                  )}
                </div>
                {readingEntry.created_at && (
                  <span className="text-xs text-muted-foreground">
                    Written at {formatJournalTime(readingEntry.created_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => handleStartEdit(readingEntry)}
                >
                  <Edit3 className="size-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setReadingEntry(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Modal Title */}
            {readingEntry.title && (
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
                {readingEntry.title}
              </h2>
            )}

            {/* Modal Paragraphs / Letter Content */}
            <div className="text-base sm:text-lg leading-relaxed text-foreground/90 font-sans whitespace-pre-wrap py-2 selection:bg-primary/20">
              {readingEntry.content}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground mt-auto">
              <div>
                {getWordCount(readingEntry.content)} words • {getReadingTime(readingEntry.content)}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReadingEntry(null)}
              >
                Done Reading
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="size-4 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">Edit Entry</h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingEntry(null)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="h-8 text-xs w-auto cursor-pointer"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = editCategory === cat.name
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setEditCategory(cat.name)}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                          isSelected
                            ? cat.activeColor
                            : "border-border/60 bg-muted/40 text-muted-foreground"
                        )}
                      >
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Input
                  placeholder="Title (optional)"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-medium text-base"
                />
              </div>

              <div>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[220px] text-base leading-relaxed p-4"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {getWordCount(editContent)} words
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingEntry(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!editContent.trim() || isPending}
                    className="gap-1.5"
                  >
                    <Check className="size-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
