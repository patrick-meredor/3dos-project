/**
 * Helper utilities for formatting and handling Journal dates and metrics.
 */

import { getLocalDateString } from "@/lib/habits"

export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  entry_date: string // YYYY-MM-DD
  mood?: string // e.g. "Reflection", "Letter", "Thoughts", "Gratitude", "Idea"
  created_at?: string
  updated_at?: string
}

export function formatJournalDate(dateStr?: string): {
  displayDate: string
  formattedShort: string
  day: string
  monthShort: string
  year: string
  weekday: string
  isToday: boolean
  isYesterday: boolean
  relativeBadge: string
} {
  if (!dateStr) {
    const today = new Date()
    return {
      displayDate: today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      formattedShort: today.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      day: String(today.getDate()),
      monthShort: today.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      year: String(today.getFullYear()),
      weekday: today.toLocaleDateString("en-US", { weekday: "long" }),
      isToday: true,
      isYesterday: false,
      relativeBadge: "Today",
    }
  }

  const today = new Date()
  const todayStr = getLocalDateString(today)

  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getLocalDateString(yesterday)

  const d = new Date(dateOnly + "T00:00:00")
  const isInvalid = isNaN(d.getTime())
  const validD = isInvalid ? new Date() : d

  const day = String(validD.getDate())
  const monthShort = validD.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const year = String(validD.getFullYear())
  const weekday = validD.toLocaleDateString("en-US", { weekday: "long" })

  const displayDate = validD.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const formattedShort = validD.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  const isToday = dateOnly === todayStr
  const isYesterday = dateOnly === yesterdayStr

  let relativeBadge = formattedShort
  if (isToday) relativeBadge = "Today"
  else if (isYesterday) relativeBadge = "Yesterday"

  return {
    displayDate,
    formattedShort,
    day,
    monthShort,
    year,
    weekday,
    isToday,
    isYesterday,
    relativeBadge,
  }
}

export function formatJournalTime(timestamp?: string): string {
  if (!timestamp) return ""
  try {
    const d = new Date(timestamp)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  } catch {
    return ""
  }
}

export function getWordCount(text: string): number {
  if (!text) return 0
  const words = text.trim().split(/\s+/)
  return words.filter(Boolean).length
}

export function getReadingTime(text: string): string {
  const words = getWordCount(text)
  const minutes = Math.max(1, Math.ceil(words / 180))
  return `${minutes} min read`
}
