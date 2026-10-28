"use client"

import { useState, useTransition, useMemo, useEffect, useRef, useCallback } from "react"
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
  AlertTriangle,
  RotateCcw,
  Loader2,
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
  type JournalDraft,
} from "@/lib/journal"
import {
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  saveJournalDraft,
  deleteJournalDraft,
  publishJournalDraft,
} from "@/app/journal/action"

interface JournalViewProps {
  initialEntries: JournalEntry[]
  initialDraft?: JournalDraft | null
  userId?: string
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
  {
    name: "Learning",
    icon: BookOpen,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    activeColor: "bg-indigo-500 text-white border-indigo-500",
  }
]

function getDraftStorageKey(userId?: string): string {
  return userId ? `dayone_journal_draft_${userId}` : "dayone_journal_draft_guest"
}

function loadLocalDraft(userId?: string): JournalDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(getDraftStorageKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as JournalDraft
  } catch {
    return null
  }
}

function saveLocalDraft(draft: JournalDraft, userId?: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(getDraftStorageKey(userId), JSON.stringify(draft))
  } catch (err) {
    console.error("Failed to save draft to localStorage:", err)
  }
}

function clearLocalDraft(userId?: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(getDraftStorageKey(userId))
  } catch (err) {
    console.error("Failed to clear draft from localStorage:", err)
  }
}

export function JournalView({
  initialEntries,
  initialDraft = null,
  userId,
  tableMissing = false,
  dbError,
}: JournalViewProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all")

  // Draft state (associated with current user)
  const [activeDraft, setActiveDraft] = useState<JournalDraft | null>(initialDraft)
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [draftStatusMessage, setDraftStatusMessage] = useState<string>("")
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false)

  // Editor states (New Entry)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [entryDate, setEntryDate] = useState(getLocalDateString())
  const [selectedCategory, setSelectedCategory] = useState("Thoughts")

  // Reading modal state
  const [readingEntry, setReadingEntry] = useState<JournalEntry | null>(null)

  // Editing state (Existing Entry)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editCategory, setEditCategory] = useState("Thoughts")

  // Delete confirmation for published entry
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Feedback & Transitions
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(dbError ?? null)
  const [copiedSql, setCopiedSql] = useState(false)

  // References for debounce & race condition prevention
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const saveSequenceRef = useRef<number>(0)
  const editorRef = useRef<HTMLDivElement | null>(null)

  // Initialize draft: reconcile initial server draft with user-scoped localStorage
  useEffect(() => {
    const local = loadLocalDraft(userId)
    if (local && (!initialDraft || new Date(local.updated_at) > new Date(initialDraft.updated_at))) {
      setActiveDraft(local)
      // Sync local draft to database in background
      saveJournalDraft({
        id: local.id,
        entry_id: local.entry_id,
        title: local.title,
        content: local.content,
        entry_date: local.entry_date,
        mood: local.mood,
      }).then((res) => {
        if (res.success && res.draft) {
          setActiveDraft(res.draft)
          saveLocalDraft(res.draft, userId)
        }
      })
    } else if (initialDraft) {
      setActiveDraft(initialDraft)
      saveLocalDraft(initialDraft, userId)
    }
  }, [initialDraft, userId])

  // Cleanup pending debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  // Auto-save handler with debounce and race-condition prevention
  const triggerAutoSave = useCallback(
    (draftData: {
      id?: string
      entry_id?: string | null
      title: string
      content: string
      entry_date: string
      mood: string
    }) => {
      const hasContent = draftData.content.trim().length > 0 || draftData.title.trim().length > 0

      // If both content and title are completely empty, don't auto-save
      if (!hasContent) {
        return
      }

      const sequence = ++saveSequenceRef.current
      setDraftStatus("saving")

      const nowIso = new Date().toISOString()
      const draftRecord: JournalDraft = {
        id: draftData.id,
        user_id: userId,
        entry_id: draftData.entry_id || null,
        title: draftData.title,
        content: draftData.content,
        entry_date: draftData.entry_date,
        mood: draftData.mood,
        updated_at: nowIso,
      }

      // 1. Instant local persistence (0ms delay, survives crash/close)
      setActiveDraft(draftRecord)
      saveLocalDraft(draftRecord, userId)

      // 2. Debounced network auto-save (750ms)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = setTimeout(async () => {
        try {
          const res = await saveJournalDraft({
            id: draftRecord.id,
            entry_id: draftRecord.entry_id,
            title: draftRecord.title,
            content: draftRecord.content,
            entry_date: draftRecord.entry_date,
            mood: draftRecord.mood,
          })

          // Stale request protection
          if (saveSequenceRef.current !== sequence) return

          if (res.success && res.draft) {
            setActiveDraft(res.draft)
            saveLocalDraft(res.draft, userId)
            setDraftStatus("saved")
            const timeStr = new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            setDraftStatusMessage(`Draft saved at ${timeStr}`)
          } else {
            setDraftStatus("error")
          }
        } catch {
          if (saveSequenceRef.current === sequence) {
            setDraftStatus("error")
          }
        }
      }, 750)
    },
    [userId]
  )

  // Handlers for New Entry Editor typing
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    triggerAutoSave({
      id: activeDraft?.entry_id ? undefined : activeDraft?.id,
      entry_id: null,
      title: newTitle,
      content,
      entry_date: entryDate,
      mood: selectedCategory,
    })
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    triggerAutoSave({
      id: activeDraft?.entry_id ? undefined : activeDraft?.id,
      entry_id: null,
      title,
      content: newContent,
      entry_date: entryDate,
      mood: selectedCategory,
    })
  }

  const handleCategoryChange = (newMood: string) => {
    setSelectedCategory(newMood)
    triggerAutoSave({
      id: activeDraft?.entry_id ? undefined : activeDraft?.id,
      entry_id: null,
      title,
      content,
      entry_date: entryDate,
      mood: newMood,
    })
  }

  const handleDateChange = (newDate: string) => {
    setEntryDate(newDate)
    triggerAutoSave({
      id: activeDraft?.entry_id ? undefined : activeDraft?.id,
      entry_id: null,
      title,
      content,
      entry_date: newDate,
      mood: selectedCategory,
    })
  }

  // Handlers for Edit Entry Modal typing
  const handleEditTitleChange = (newTitle: string) => {
    setEditTitle(newTitle)
    if (editingEntry) {
      triggerAutoSave({
        id: activeDraft?.entry_id === editingEntry.id ? activeDraft?.id : undefined,
        entry_id: editingEntry.id,
        title: newTitle,
        content: editContent,
        entry_date: editDate,
        mood: editCategory,
      })
    }
  }

  const handleEditContentChange = (newContent: string) => {
    setEditContent(newContent)
    if (editingEntry) {
      triggerAutoSave({
        id: activeDraft?.entry_id === editingEntry.id ? activeDraft?.id : undefined,
        entry_id: editingEntry.id,
        title: editTitle,
        content: newContent,
        entry_date: editDate,
        mood: editCategory,
      })
    }
  }

  const handleEditCategoryChange = (newMood: string) => {
    setEditCategory(newMood)
    if (editingEntry) {
      triggerAutoSave({
        id: activeDraft?.entry_id === editingEntry.id ? activeDraft?.id : undefined,
        entry_id: editingEntry.id,
        title: editTitle,
        content: editContent,
        entry_date: editDate,
        mood: newMood,
      })
    }
  }

  const handleEditDateChange = (newDate: string) => {
    setEditDate(newDate)
    if (editingEntry) {
      triggerAutoSave({
        id: activeDraft?.entry_id === editingEntry.id ? activeDraft?.id : undefined,
        entry_id: editingEntry.id,
        title: editTitle,
        content: editContent,
        entry_date: newDate,
        mood: editCategory,
      })
    }
  }

  // Resume Draft in Editor
  const handleResumeDraft = (draftToResume: JournalDraft) => {
    if (draftToResume.entry_id) {
      // Resume editing an existing entry
      const originalEntry = entries.find((e) => e.id === draftToResume.entry_id)
      if (originalEntry) {
        setEditingEntry(originalEntry)
        setEditTitle(draftToResume.title)
        setEditContent(draftToResume.content)
        setEditDate(draftToResume.entry_date)
        setEditCategory(draftToResume.mood || "Thoughts")
        setDraftStatus("saved")
        setDraftStatusMessage("Resumed draft edit")
        return
      }
    }

    // Resume new entry draft
    setTitle(draftToResume.title)
    setContent(draftToResume.content)
    setEntryDate(draftToResume.entry_date || getLocalDateString())
    setSelectedCategory(draftToResume.mood || "Thoughts")
    setIsEditorOpen(true)
    setDraftStatus("saved")
    setDraftStatusMessage("Resumed unfinished draft")

    // Scroll smoothly to editor
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  // Explicitly Save / Publish Draft
  const handlePublishDraft = (draftToPublish: JournalDraft) => {
    if (!draftToPublish.content.trim()) return

    const tempId = `temp-${Date.now()}`
    const isEdit = Boolean(draftToPublish.entry_id)
    const targetEntryId = draftToPublish.entry_id

    // Optimistic UI updates
    if (isEdit && targetEntryId) {
      setEntries((list) =>
        list.map((item) =>
          item.id === targetEntryId
            ? {
                ...item,
                title: draftToPublish.title.trim(),
                content: draftToPublish.content.trim(),
                entry_date: draftToPublish.entry_date,
                mood: draftToPublish.mood,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      )
    } else {
      const optimisticEntry: JournalEntry = {
        id: tempId,
        user_id: userId || "",
        title: draftToPublish.title.trim(),
        content: draftToPublish.content.trim(),
        entry_date: draftToPublish.entry_date || getLocalDateString(),
        mood: draftToPublish.mood || "Thoughts",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setEntries((prev) => [optimisticEntry, ...prev])
    }

    // Clear draft state immediately
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setActiveDraft(null)
    clearLocalDraft(userId)
    setDraftStatus("idle")
    setIsEditorOpen(false)
    setEditingEntry(null)

    startTransition(async () => {
      const res = await publishJournalDraft({
        id: draftToPublish.id,
        entry_id: draftToPublish.entry_id,
        title: draftToPublish.title,
        content: draftToPublish.content,
        entry_date: draftToPublish.entry_date,
        mood: draftToPublish.mood,
      })

      if (!res.success) {
        if (!isEdit) {
          setEntries((prev) => prev.filter((item) => item.id !== tempId))
        }
        setActionError(res.error || "Failed to publish journal draft.")
      } else if (res.entry && !isEdit) {
        setEntries((prev) =>
          prev.map((item) => (item.id === tempId ? res.entry! : item))
        )
      }
    })
  }

  // Discard / Cancel Draft Permanently
  const handleConfirmDiscardDraft = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    const draftIdToDelete = activeDraft?.id
    setActiveDraft(null)
    clearLocalDraft(userId)
    setDraftStatus("idle")
    setConfirmDiscardOpen(false)

    // Reset editor inputs if they held this draft
    setTitle("")
    setContent("")
    setEntryDate(getLocalDateString())
    setSelectedCategory("Thoughts")
    setIsEditorOpen(false)

    if (editingEntry) {
      setEditingEntry(null)
    }

    startTransition(async () => {
      await deleteJournalDraft(draftIdToDelete)
    })
  }

  // Handle Save New Entry from Form Submission
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    const draftToPublish: JournalDraft = {
      id: activeDraft?.entry_id ? undefined : activeDraft?.id,
      user_id: userId,
      entry_id: null,
      title,
      content,
      entry_date: entryDate,
      mood: selectedCategory,
      updated_at: new Date().toISOString(),
    }

    handlePublishDraft(draftToPublish)
  }

  // Handle Start Edit
  const handleStartEdit = (entry: JournalEntry) => {
    // If we have an existing draft for this entry, load draft content
    if (activeDraft?.entry_id === entry.id) {
      handleResumeDraft(activeDraft)
      return
    }

    setEditingEntry(entry)
    setEditTitle(entry.title)
    setEditContent(entry.content)
    setEditDate(entry.entry_date)
    setEditCategory(entry.mood || "Thoughts")
    setDraftStatus("idle")
    setDraftStatusMessage("")

    if (readingEntry?.id === entry.id) {
      setReadingEntry(null)
    }
  }

  // Handle Save Edit from Form Submission
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEntry || !editContent.trim()) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    const draftToPublish: JournalDraft = {
      id: activeDraft?.entry_id === editingEntry.id ? activeDraft?.id : undefined,
      user_id: userId,
      entry_id: editingEntry.id,
      title: editTitle,
      content: editContent,
      entry_date: editDate || editingEntry.entry_date,
      mood: editCategory,
      updated_at: new Date().toISOString(),
    }

    handlePublishDraft(draftToPublish)
  }

  // Handle Delete Published Entry
  const handleDelete = (id: string) => {
    const backup = entries.find((e) => e.id === id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setDeletingId(null)
    if (readingEntry?.id === id) {
      setReadingEntry(null)
    }

    // If an active draft was editing this deleted entry, clear the draft
    if (activeDraft?.entry_id === id) {
      setActiveDraft(null)
      clearLocalDraft(userId)
    }

    startTransition(async () => {
      const res = await deleteJournalEntry(id)
      if (!res.success && backup) {
        setEntries((prev) => [backup, ...prev])
        setActionError(res.error || "Failed to delete entry.")
      }
    })
  }

  const sqlSnippet = `-- Run this in your Supabase SQL Editor:
create table if not exists public.journals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null default '',
  content text not null,
  entry_date date default current_date not null,
  mood text default 'Thoughts' not null,
  is_draft boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.journals enable row level security;

create policy "Users can manage their own journals"
  on public.journals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- If you already have the journals table, run this to add the is_draft column:
alter table public.journals add column if not exists is_draft boolean default false not null;`

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  // Live Metrics (Calculated only on published entries)
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

  // Filtered Published Entries
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

  // Check if active draft has visible content to resume
  const hasActiveDraft = Boolean(
    activeDraft && (activeDraft.content.trim().length > 0 || activeDraft.title.trim().length > 0)
  )

  const activeDraftCategoryConfig = activeDraft
    ? CATEGORIES.find(
        (c) => c.name.toLowerCase() === (activeDraft.mood || "").toLowerCase()
      ) || CATEGORIES[0]
    : CATEGORIES[0]
  const ActiveDraftIcon = activeDraftCategoryConfig.icon

  // Find original entry if draft is an edit
  const originalEntryForDraft = activeDraft?.entry_id
    ? entries.find((e) => e.id === activeDraft.entry_id)
    : null

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
                has not been initialized yet in your Supabase project. Run this SQL query to create the table with Row Level Security and draft support:
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

      {/* Page Title & Actions Header */}
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
                Capture thoughts, letters, memories, and personal reflections with automatic draft saving.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveDraft && !isEditorOpen && !editingEntry && (
            <Button
              onClick={() => handleResumeDraft(activeDraft!)}
              variant="outline"
              className="gap-2 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-xs cursor-pointer"
            >
              <RotateCcw className="size-4" />
              Resume Draft
            </Button>
          )}

          <Button
            onClick={() => {
              if (isEditorOpen) {
                // Simply close editor without discarding draft
                setIsEditorOpen(false)
              } else {
                if (hasActiveDraft && !activeDraft?.entry_id) {
                  // Resume existing draft
                  handleResumeDraft(activeDraft!)
                } else {
                  // Open empty new editor
                  setTitle("")
                  setContent("")
                  setEntryDate(getLocalDateString())
                  setSelectedCategory("Thoughts")
                  setIsEditorOpen(true)
                }
                setTimeout(() => {
                  editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                }, 50)
              }
            }}
            className="gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
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

      {/* Unfinished Draft Resume Card (Displayed when a draft exists and editor is closed) */}
      {hasActiveDraft && !isEditorOpen && !editingEntry && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-card/90 to-card/90 p-5 sm:p-6 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2.5 bg-amber-500"></span>
                </span>
                <span className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-1.5">
                  {activeDraft?.entry_id ? "Unfinished Edit Draft" : "Unfinished Journal Draft"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  Auto-saved
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>
                  Updated {formatJournalDate(activeDraft?.updated_at).relativeBadge}{" "}
                  {formatJournalTime(activeDraft?.updated_at) ? `at ${formatJournalTime(activeDraft?.updated_at)}` : ""}
                </span>
              </div>
            </div>

            <div>
              {originalEntryForDraft && (
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <span>Modifying published entry:</span>
                  <span className="font-medium text-foreground">
                    &ldquo;{originalEntryForDraft.title || "Untitled"}&rdquo;
                  </span>
                  <span>({formatJournalDate(originalEntryForDraft.entry_date).displayDate})</span>
                </p>
              )}

              <h3 className="text-lg font-bold text-foreground">
                {activeDraft?.title ? activeDraft.title : <span className="italic text-muted-foreground font-normal">Untitled Draft</span>}
              </h3>

              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-line font-sans">
                {activeDraft?.content || <span className="italic">No content written yet...</span>}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border bg-muted/60 text-foreground font-medium">
                  <ActiveDraftIcon className="size-3 text-muted-foreground" />
                  {activeDraft?.mood || "Thoughts"}
                </span>
                <span>•</span>
                <span>{formatJournalDate(activeDraft?.entry_date).displayDate}</span>
                <span>•</span>
                <span>{getWordCount(activeDraft?.content || "")} words</span>
              </div>
            </div>

            {/* Draft Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-500/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDiscardOpen(true)}
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                Discard Draft
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleResumeDraft(activeDraft!)}
                  className="gap-1.5 text-xs shadow-xs cursor-pointer"
                >
                  <Edit3 className="size-3.5 text-primary" />
                  Continue Editing
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handlePublishDraft(activeDraft!)}
                  disabled={!activeDraft?.content.trim() || isPending}
                  className="gap-1.5 text-xs shadow-xs cursor-pointer"
                >
                  <Check className="size-3.5" />
                  Save Journal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expandable New Entry Editor */}
      {isEditorOpen && (
        <div
          ref={editorRef}
          className="rounded-2xl border border-primary/30 bg-card/90 p-5 sm:p-6 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <form onSubmit={handleSaveNew} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <PenSquare className="size-4 text-primary" />
                <span className="font-semibold text-base">Write a New Entry</span>

                {/* Live Auto-save Status Indicator */}
                <div className="ml-2 flex items-center text-xs">
                  {draftStatus === "saving" && (
                    <span className="inline-flex items-center gap-1.5 text-amber-500 font-medium">
                      <Loader2 className="size-3 animate-spin" />
                      Saving draft...
                    </span>
                  )}
                  {draftStatus === "saved" && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium animate-in fade-in">
                      <Check className="size-3" />
                      {draftStatusMessage || "Draft saved"}
                    </span>
                  )}
                  {draftStatus === "error" && (
                    <span className="inline-flex items-center gap-1.5 text-rose-500 font-medium">
                      <AlertCircle className="size-3" />
                      Save failed (saved locally)
                    </span>
                  )}
                </div>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="h-8 w-auto text-xs py-0 px-2 cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleDateChange(getLocalDateString())}
                  className="text-xs cursor-pointer"
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
                    onClick={() => handleCategoryChange(cat.name)}
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
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-base font-medium h-10 placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Content Textarea */}
            <div className="relative">
              <Textarea
                placeholder="Write your text, paragraphs, letters, or thoughts here... Pour your heart out."
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
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
                {hasActiveDraft && !activeDraft?.entry_id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDiscardOpen(true)}
                    className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    Discard Draft
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditorOpen(false)}
                  className="cursor-pointer"
                >
                  Close (Keeps Draft)
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim() || isPending}
                  className="gap-2 px-4 shadow-sm cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      Save Journal
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
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
              onClick={() => {
                if (hasActiveDraft && !activeDraft?.entry_id) {
                  handleResumeDraft(activeDraft!)
                } else {
                  setIsEditorOpen(true)
                }
              }}
              size="sm"
              className="mt-2 gap-1.5 cursor-pointer"
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
            const hasDraftForThisEntry = activeDraft?.entry_id === entry.id

            return (
              <div
                key={entry.id}
                className={cn(
                  "group relative rounded-2xl border bg-card/70 p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md backdrop-blur-xs flex flex-col justify-between",
                  hasDraftForThisEntry ? "border-amber-500/50 bg-amber-500/5" : "border-border/70"
                )}
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
                          {hasDraftForThisEntry && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Draft Edit
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
                      className="hover:text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      <Eye className="size-3.5" />
                    </Button>

                    {/* Edit Button */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title={hasDraftForThisEntry ? "Resume Draft Edit" : "Edit Entry"}
                      onClick={() => handleStartEdit(entry)}
                      className={cn(
                        "hover:text-blue-500 hover:bg-blue-500/10 cursor-pointer",
                        hasDraftForThisEntry && "text-amber-500"
                      )}
                    >
                      <Edit3 className="size-3.5" />
                    </Button>

                    {/* Delete Action with confirm */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 bg-destructive/10 p-1 rounded border border-destructive/20 animate-in fade-in">
                        <Button
                          variant="destructive"
                          size="xs"
                          className="h-6 text-[10px] px-1.5 cursor-pointer"
                          onClick={() => handleDelete(entry.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-6 text-[10px] px-1 cursor-pointer"
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
                        className="hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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
                  className="gap-1.5 text-xs cursor-pointer"
                  onClick={() => handleStartEdit(readingEntry)}
                >
                  <Edit3 className="size-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setReadingEntry(null)}
                  className="cursor-pointer"
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
                className="cursor-pointer"
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
                {/* Status Indicator */}
                <div className="ml-2 flex items-center text-xs">
                  {draftStatus === "saving" && (
                    <span className="inline-flex items-center gap-1.5 text-amber-500 font-medium">
                      <Loader2 className="size-3 animate-spin" />
                      Saving draft...
                    </span>
                  )}
                  {draftStatus === "saved" && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium animate-in fade-in">
                      <Check className="size-3" />
                      {draftStatusMessage || "Draft saved"}
                    </span>
                  )}
                  {draftStatus === "error" && (
                    <span className="inline-flex items-center gap-1.5 text-rose-500 font-medium">
                      <AlertCircle className="size-3" />
                      Save failed (saved locally)
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingEntry(null)}
                className="cursor-pointer"
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
                    onChange={(e) => handleEditDateChange(e.target.value)}
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
                        onClick={() => handleEditCategoryChange(cat.name)}
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
                  onChange={(e) => handleEditTitleChange(e.target.value)}
                  className="font-medium text-base"
                />
              </div>

              <div>
                <Textarea
                  value={editContent}
                  onChange={(e) => handleEditContentChange(e.target.value)}
                  className="min-h-[220px] text-base leading-relaxed p-4"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {getWordCount(editContent)} words
                </span>
                <div className="flex items-center gap-2">
                  {activeDraft?.entry_id === editingEntry.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDiscardOpen(true)}
                      className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      Discard Draft
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingEntry(null)}
                    className="cursor-pointer"
                  >
                    Close (Keeps Draft)
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!editContent.trim() || isPending}
                    className="gap-1.5 cursor-pointer"
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

      {/* Confirmation Modal for Discarding Draft */}
      {confirmDiscardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  Discard Unfinished Draft?
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {activeDraft?.entry_id
                    ? "Are you sure you want to discard your draft edits? Your original published journal entry will not be affected or deleted."
                    : "Are you sure you want to discard this unfinished draft? Any unsaved writing will be permanently deleted."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDiscardOpen(false)}
                className="cursor-pointer"
              >
                Keep Draft
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDiscardDraft}
                className="gap-1.5 cursor-pointer"
              >
                <Trash2 className="size-4" />
                Discard Draft
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
