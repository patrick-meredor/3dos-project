"use client"

import { useState, useTransition, useEffect } from "react"
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  ListTodo,
  Sparkles,
  Database,
  Copy,
  CheckCheck,
  Clock,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { formatTodoDate, formatTodoCreatedAt, getTodoTimingStatus } from "@/lib/todos"
import { getLocalDateString } from "@/lib/habits"
import { getWordCount } from "@/lib/journal"
import { addTodo, updateTodo, deleteTodo, type TodoItem } from "@/app/todos/action"

interface TodosViewProps {
  initialTodos: TodoItem[]
  tableMissing?: boolean
  dbError?: string
}

export function TodosView({ initialTodos, tableMissing = false, dbError }: TodosViewProps) {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [readingTodo, setReadingTodo] = useState<TodoItem | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [copiedSql, setCopiedSql] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(dbError ?? null)

  // Keyboard shortcut listener to close reader modal via Escape key
  useEffect(() => {
    if (!readingTodo) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReadingTodo(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [readingTodo])

  const sqlSnippet = `-- Run this in your Supabase SQL Editor:
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  content text default '',
  is_completed boolean default false not null,
  completed_at timestamp with time zone,
  due_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- If you already created public.todos, run these lines:
alter table public.todos add column if not exists content text default '';
alter table public.todos add column if not exists completed_at timestamp with time zone;

alter table public.todos enable row level security;

create policy "Users can manage their own todos"
  on public.todos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  // Handle Add Todo with Title & Content
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const tempId = `temp-${Date.now()}`
    const titleToAdd = newTitle.trim()
    const contentToAdd = newContent.trim()
    setNewTitle("")
    setNewContent("")
    setActionError(null)

    // Optimistic insert
    const optimisticTodo: TodoItem = {
      id: tempId,
      user_id: "",
      title: titleToAdd,
      content: contentToAdd,
      is_completed: false,
      due_date: getLocalDateString(),
      completed_at: undefined,
      created_at: new Date().toISOString(),
    }
    setTodos((prev) => [optimisticTodo, ...prev])

    startTransition(async () => {
      const res = await addTodo(titleToAdd, contentToAdd)
      if (!res.success) {
        setActionError(res.error || "Failed to create task.")
        // Rollback
        setTodos((prev) => prev.filter((t) => t.id !== tempId))
      } else if (res.todo) {
        // Replace temp with real record
        setTodos((prev) =>
          prev.map((t) => (t.id === tempId ? res.todo! : t))
        )
      }
    })
  }

  // Handle Toggle Completion
  const handleToggle = (todo: TodoItem) => {
    if (editingId === todo.id) {
      setEditingId(null)
    }
    const nextState = !todo.is_completed
    const nowIso = new Date().toISOString()
    const nextCompletedAt = nextState ? nowIso : undefined

    // Optimistic toggle
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id
          ? { ...t, is_completed: nextState, completed_at: nextCompletedAt }
          : t
      )
    )

    if (readingTodo?.id === todo.id) {
      setReadingTodo((prev) =>
        prev
          ? { ...prev, is_completed: nextState, completed_at: nextCompletedAt }
          : null
      )
    }

    startTransition(async () => {
      const res = await updateTodo(todo.id, {
        is_completed: nextState,
        completed_at: nextCompletedAt ?? null,
      })
      if (!res.success) {
        setActionError(res.error || "Failed to update task status.")
        // Rollback
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? todo : t))
        )
      }
    })
  }

  // Start Edit
  const startEdit = (todo: TodoItem) => {
    if (todo.is_completed) return
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditContent(todo.content ?? "")
    if (readingTodo?.id === todo.id) {
      setReadingTodo(null)
    }
  }

  // Save Edit
  const saveEdit = (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }

    const original = todos.find((t) => t.id === id)
    if (original?.is_completed) {
      setEditingId(null)
      return
    }

    const updatedTitle = editTitle.trim()
    const updatedContent = editContent.trim()
    setEditingId(null)

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, title: updatedTitle, content: updatedContent } : t
      )
    )

    if (readingTodo?.id === id) {
      setReadingTodo((prev) =>
        prev ? { ...prev, title: updatedTitle, content: updatedContent } : null
      )
    }

    startTransition(async () => {
      const res = await updateTodo(id, { title: updatedTitle, content: updatedContent })
      if (!res.success) {
        setActionError(res.error || "Failed to update todo.")
        if (original) {
          setTodos((prev) =>
            prev.map((t) => (t.id === id ? original : t))
          )
        }
      }
    })
  }

  // Handle Delete
  const handleDelete = (id: string) => {
    const original = todos.find((t) => t.id === id)
    // Optimistic removal
    setTodos((prev) => prev.filter((t) => t.id !== id))
    if (readingTodo?.id === id) {
      setReadingTodo(null)
    }

    startTransition(async () => {
      const res = await deleteTodo(id)
      if (!res.success) {
        setActionError(res.error || "Failed to delete task.")
        if (original) {
          setTodos((prev) => [original, ...prev])
        }
      }
    })
  }

  // Filtering
  const activeCount = todos.filter((t) => !t.is_completed).length
  const completedCount = todos.filter((t) => t.is_completed).length

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.is_completed
    if (filter === "completed") return t.is_completed
    return true
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Table Missing Banner */}
      {tableMissing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
              <Database className="h-4 w-4" />
              <span>Supabase &lsquo;todos&rsquo; Table Setup Required</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySql}
              className="gap-1.5 text-xs h-7 cursor-pointer"
            >
              {copiedSql ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedSql ? "Copied!" : "Copy SQL"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The table <code className="font-mono bg-muted px-1 py-0.5 rounded">public.todos</code> does not exist yet in your Supabase project. Click the button above to copy the table schema, paste it into your <strong>Supabase Dashboard &rarr; SQL Editor</strong>, and click <strong>Run</strong>.
          </p>
          <pre className="p-3 rounded-lg bg-background border text-[11px] font-mono text-muted-foreground overflow-x-auto">
            {sqlSnippet}
          </pre>
        </div>
      )}

      {/* General Action Error Alert */}
      {actionError && !tableMissing && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive font-medium flex items-center justify-between">
          <span>{actionError}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setActionError(null)}
            className="text-destructive hover:bg-destructive/15 cursor-pointer"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-bernoru tracking-tight">
            DAILY TODOS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500 shrink-0" />
            <span>Keep your daily non-negotiables organized and synced with Supabase.</span>
          </p>
        </div>

        {/* Counter Stats */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {activeCount} Active
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            {completedCount} Completed
          </span>
        </div>
      </div>

      {/* Add Todo Form with Separate Title & Detailed Content Fields */}
      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm p-3.5 sm:p-4 shadow-sm flex flex-col gap-3 transition-all focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20"
      >
        <div className="flex flex-col gap-2.5">
          {/* Title Field */}
          <div>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Todo Title (e.g. Complete quarterly project review)..."
              className="h-10 text-sm font-medium placeholder:text-muted-foreground/60 bg-background/50"
              disabled={isPending}
            />
          </div>

          {/* Detailed Content / Instructions Field */}
          <div>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Detailed description or instructions (optional, previewable via eye icon)..."
              rows={2}
              className="text-sm min-h-[68px] leading-relaxed resize-y placeholder:text-muted-foreground/60 bg-background/50"
              disabled={isPending}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault()
                  if (newTitle.trim() && !isPending) {
                    handleAdd(e)
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] sm:text-xs text-muted-foreground hidden xs:inline sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Enter</kbd> to add or <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Ctrl+Enter</kbd> from description.
          </p>
          <Button
            variant="default"
            type="submit"
            disabled={isPending || !newTitle.trim()}
            className="gap-1.5 h-9 px-4 ml-auto shrink-0 cursor-pointer"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Add Todo</span>
          </Button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs h-7 px-2.5 sm:px-3 cursor-pointer"
          >
            All ({todos.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("active")}
            className="text-xs h-7 px-2.5 sm:px-3 cursor-pointer"
          >
            Active ({activeCount})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("completed")}
            className="text-xs h-7 px-2.5 sm:px-3 cursor-pointer"
          >
            Completed ({completedCount})
          </Button>
        </div>
      </div>

      {/* Todos List */}
      <div className="space-y-2.5">
        {filteredTodos.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center space-y-3 bg-muted/20">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-muted text-muted-foreground">
                <ListTodo className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold font-bernoru tracking-wide">
                {filter === "completed"
                  ? "No completed tasks yet"
                  : filter === "active"
                  ? "All caught up!"
                  : "No tasks found"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {filter === "all"
                  ? "Start by adding your first daily habit above to build momentum."
                  : filter === "active"
                  ? "Great job! You have completed all your active tasks."
                  : "Mark tasks as complete to see them here."}
              </p>
            </div>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const isEditing = editingId === todo.id && !todo.is_completed
            const timing = getTodoTimingStatus(todo.created_at, todo.completed_at, todo.is_completed)

            return (
              <div
                key={todo.id}
                className={cn(
                  "group flex items-start sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border bg-card backdrop-blur-sm shadow-sm transition-all hover:shadow-md",
                  todo.is_completed && "opacity-75 bg-muted/40"
                )}
              >
                {/* Checkbox & Todo Details (Title, Description Preview, Timestamps) */}
                <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(todo)}
                    className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={todo.is_completed ? "Mark as active" : "Mark as completed"}
                  >
                    {todo.is_completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="h-5 w-5 hover:text-orange-500" />
                    )}
                  </button>

                  {isEditing ? (
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Todo title"
                        autoFocus
                        className="h-8 text-sm font-medium"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(todo.id)
                          if (e.key === "Escape") setEditingId(null)
                        }}
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Detailed description or instructions..."
                        rows={2}
                        className="text-xs min-h-[56px] leading-relaxed resize-y"
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                            saveEdit(todo.id)
                          }
                          if (e.key === "Escape") setEditingId(null)
                        }}
                      />
                      <div className="flex items-center justify-end gap-1.5 pt-0.5">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => saveEdit(todo.id)}
                          className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Save</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Cancel</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col min-w-0 flex-1">
                      {/* Prominent Todo Title */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          onClick={() => handleToggle(todo)}
                          className={cn(
                            "text-sm font-semibold text-foreground transition-all select-none truncate cursor-pointer hover:text-primary",
                            todo.is_completed && "line-through text-muted-foreground font-normal"
                          )}
                          title={todo.title}
                        >
                          {todo.title}
                        </span>
                      </div>

                      {/* Snippet / Preview of Content if present */}
                      {todo.content ? (
                        <p
                          onClick={() => setReadingTodo(todo)}
                          className={cn(
                            "text-xs text-muted-foreground line-clamp-1 mt-0.5 cursor-pointer hover:text-foreground transition-colors font-sans",
                            todo.is_completed && "line-through opacity-70"
                          )}
                          title="Click to view full instructions"
                        >
                          {todo.content}
                        </p>
                      ) : null}

                      {/* Status Badge & Timestamps */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        {todo.is_completed ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border",
                              timing.status === "okay"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            )}
                          >
                            {timing.status === "okay" ? (
                              <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            ) : (
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            )}
                            <span>{timing.badgeLabel}</span>
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border",
                              timing.status === "today"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            )}
                          >
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span>{timing.status === "today" ? "Today" : "Overdue"}</span>
                          </span>
                        )}

                        {timing.createdFormatted && (
                          <span
                            suppressHydrationWarning
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-muted-foreground/80"
                            title={`Created on ${timing.createdFormatted}`}
                          >
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground/60" />
                            <span>Created {timing.createdFormatted}</span>
                          </span>
                        )}

                        {todo.is_completed && timing.completedFormatted && (
                          <span
                            suppressHydrationWarning
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-muted-foreground/80"
                            title={`Done on ${timing.completedFormatted}`}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground/60" />
                            <span>Done {timing.completedFormatted}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions: Eye (Read Full Content), Edit & Delete */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 sm:mt-0">
                    {/* Read Full Content Button (Reusing Journal's Eye Icon Style) */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setReadingTodo(todo)}
                      title="See full content"
                      className="size-7 hover:text-primary hover:bg-primary/10 cursor-pointer text-muted-foreground"
                    >
                      <Eye className="size-3.5" />
                    </Button>

                    {!todo.is_completed && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => startEdit(todo)}
                        title="Edit task"
                        className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(todo.id)}
                      title="Delete task"
                      className="size-7 text-destructive hover:bg-destructive/15 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Reader Modal (Todo Full Content Preview) */}
      {readingTodo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setReadingTodo(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl overflow-y-auto flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Badge */}
                  {readingTodo.is_completed ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        getTodoTimingStatus(readingTodo.created_at, readingTodo.completed_at, readingTodo.is_completed).status === "okay"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      )}
                    >
                      <CheckCircle2 className="size-3" />
                      <span>{getTodoTimingStatus(readingTodo.created_at, readingTodo.completed_at, readingTodo.is_completed).badgeLabel}</span>
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        getTodoTimingStatus(readingTodo.created_at, readingTodo.completed_at, readingTodo.is_completed).status === "today"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      )}
                    >
                      <Clock className="size-3" />
                      <span>{getTodoTimingStatus(readingTodo.created_at, readingTodo.completed_at, readingTodo.is_completed).status === "today" ? "Today" : "Overdue"}</span>
                    </span>
                  )}

                  {readingTodo.due_date && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground border">
                      Due {formatTodoDate(readingTodo.due_date).label}
                    </span>
                  )}
                </div>

                {readingTodo.created_at && (
                  <span className="text-xs text-muted-foreground">
                    Created on {formatTodoCreatedAt(readingTodo.created_at)}
                  </span>
                )}
                {readingTodo.is_completed && readingTodo.completed_at && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Completed on {formatTodoCreatedAt(readingTodo.completed_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!readingTodo.is_completed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs cursor-pointer"
                    onClick={() => {
                      const toEdit = readingTodo
                      setReadingTodo(null)
                      startEdit(toEdit)
                    }}
                  >
                    <Edit2 className="size-3.5" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setReadingTodo(null)}
                  className="cursor-pointer"
                  aria-label="Close popup"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Modal Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight break-words">
                {readingTodo.title}
              </h2>
            </div>

            {/* Modal Paragraphs / Complete Content */}
            <div className="text-base leading-relaxed text-foreground/90 font-sans whitespace-pre-wrap py-2 selection:bg-primary/20">
              {readingTodo.content ? (
                readingTodo.content
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No detailed description provided for this task.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground mt-auto">
              <div>
                {readingTodo.content ? (
                  <span>
                    {getWordCount(readingTodo.content)} words • {readingTodo.content.length} characters
                  </span>
                ) : (
                  <span>Task Details</span>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReadingTodo(null)}
                className="cursor-pointer"
              >
                Done Reading
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
