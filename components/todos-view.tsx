"use client"

import { useState, useTransition } from "react"
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
  CheckCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { addTodo, updateTodo, deleteTodo, type TodoItem } from "@/app/todos/action"

interface TodosViewProps {
  initialTodos: TodoItem[]
  tableMissing?: boolean
  dbError?: string
}

export function TodosView({ initialTodos, tableMissing = false, dbError }: TodosViewProps) {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos)
  const [newTitle, setNewTitle] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [copiedSql, setCopiedSql] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(dbError ?? null)

  const sqlSnippet = `-- Run this in your Supabase SQL Editor:
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  is_completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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

  // Handle Add
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const tempId = `temp-${Date.now()}`
    const titleToAdd = newTitle.trim()
    setNewTitle("")
    setActionError(null)

    // Optimistic insert
    const optimisticTodo: TodoItem = {
      id: tempId,
      user_id: "",
      title: titleToAdd,
      is_completed: false,
      created_at: new Date().toISOString(),
    }
    setTodos((prev) => [optimisticTodo, ...prev])

    startTransition(async () => {
      const res = await addTodo(titleToAdd)
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
    const nextState = !todo.is_completed
    // Optimistic toggle
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, is_completed: nextState } : t))
    )

    startTransition(async () => {
      const res = await updateTodo(todo.id, { is_completed: nextState })
      if (!res.success) {
        setActionError(res.error || "Failed to update task status.")
        // Rollback
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? { ...t, is_completed: !nextState } : t))
        )
      }
    })
  }

  // Start Edit
  const startEdit = (todo: TodoItem) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
  }

  // Save Edit
  const saveEdit = (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }

    const updatedTitle = editTitle.trim()
    const original = todos.find((t) => t.id === id)
    setEditingId(null)

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: updatedTitle } : t))
    )

    startTransition(async () => {
      const res = await updateTodo(id, { title: updatedTitle })
      if (!res.success) {
        setActionError(res.error || "Failed to update title.")
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
              className="gap-1.5 text-xs h-7"
            >
              {copiedSql ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedSql ? "Copied!" : "Copy SQL"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The table <code className="font-mono bg-muted px-1 py-0.5 rounded">public.todos</code> does not exist yet in your Supabase project. Click the button above to copy the table schema, paste it into your <strong>Supabase Dashboard &rarr; SQL Editor</strong>, and click <strong>Run</strong>.
          </p>
          <pre className="p-3 rounded-lg bg-background/80 border text-[11px] font-mono text-muted-foreground overflow-x-auto">
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
            className="text-destructive hover:bg-destructive/15"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-bernoru tracking-tight">
            DAILY TODOS
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
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

      {/* Add Todo Bar */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new habit or task (e.g. 30m Deep Work, Morning Walk)..."
          className="flex-1 h-10 px-3.5 text-sm"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !newTitle.trim()} className="gap-1.5 h-10 px-4 shrink-0">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span>Add Todo</span>
        </Button>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs h-7"
          >
            All ({todos.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("active")}
            className="text-xs h-7"
          >
            Active ({activeCount})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("completed")}
            className="text-xs h-7"
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
            const isEditing = editingId === todo.id

            return (
              <div
                key={todo.id}
                className={cn(
                  "group flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm transition-all hover:shadow-md",
                  todo.is_completed && "opacity-75 bg-muted/40"
                )}
              >
                {/* Checkbox & Title */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(todo)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={todo.is_completed ? "Mark as active" : "Mark as completed"}
                  >
                    {todo.is_completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="h-5 w-5 hover:text-orange-500" />
                    )}
                  </button>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(todo.id)
                          if (e.key === "Escape") setEditingId(null)
                        }}
                        autoFocus
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        size="icon-xs"
                        variant="default"
                        onClick={() => saveEdit(todo.id)}
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
                    <span
                      onClick={() => handleToggle(todo)}
                      className={cn(
                        "text-sm font-medium transition-all select-none truncate cursor-pointer",
                        todo.is_completed && "line-through text-muted-foreground font-normal"
                      )}
                    >
                      {todo.title}
                    </span>
                  )}
                </div>

                {/* Actions: Edit & Delete */}
                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => startEdit(todo)}
                      title="Edit task"
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(todo.id)}
                      title="Delete task"
                      className="size-7 text-destructive hover:bg-destructive/15"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
