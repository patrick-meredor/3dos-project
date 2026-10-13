/**
 * Helper utilities for formatting and handling Todo dates.
 */

import { getLocalDateString } from "@/lib/habits"

export function formatTodoDate(dateStr?: string): {
  label: string
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  formattedFull: string
} {
  if (!dateStr) {
    return {
      label: "No date",
      isToday: false,
      isPast: false,
      isFuture: false,
      formattedFull: "",
    }
  }

  const today = new Date()
  const todayStr = getLocalDateString(today)

  // Extract YYYY-MM-DD whether it is an ISO timestamp or date string
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getLocalDateString(yesterday)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = getLocalDateString(tomorrow)

  const d = new Date(dateOnly + "T00:00:00")
  const formattedFull = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  if (dateOnly === todayStr) {
    return {
      label: "Today",
      isToday: true,
      isPast: false,
      isFuture: false,
      formattedFull,
    }
  }

  if (dateOnly === yesterdayStr) {
    return {
      label: "Yesterday",
      isToday: false,
      isPast: true,
      isFuture: false,
      formattedFull,
    }
  }

  if (dateOnly === tomorrowStr) {
    return {
      label: "Tomorrow",
      isToday: false,
      isPast: false,
      isFuture: true,
      formattedFull,
    }
  }

  const label = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  })

  const isPast = dateOnly < todayStr
  const isFuture = dateOnly > todayStr

  return {
    label,
    isToday: false,
    isPast,
    isFuture,
    formattedFull,
  }
}

/**
 * Formats a Todo's created_at timestamp into a readable date and time string.
 * Example: "Oct 13, 5:56 AM" or "Oct 13, 2025, 5:56 AM"
 */
export function formatTodoCreatedAt(dateStr?: string): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""

    const now = new Date()
    const isThisYear = d.getFullYear() === now.getFullYear()

    const datePart = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(isThisYear ? {} : { year: "numeric" }),
    })

    const timePart = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    return `${datePart}, ${timePart}`
  } catch {
    return ""
  }
}

export interface TodoTiming {
  isDone: boolean
  status: "okay" | "late" | "today" | "overdue"
  badgeLabel: string
  createdFormatted: string
  completedFormatted?: string
}

/**
 * Compares the todo's accomplished date/time against its created time.
 * If accomplished within the day (same local day or within 24 hours) -> "okay".
 * Otherwise -> "late".
 * For active tasks: returns "today" or "overdue".
 */
export function getTodoTimingStatus(
  createdAt?: string,
  completedAt?: string,
  isCompleted?: boolean
): TodoTiming {
  const createdFormatted = formatTodoCreatedAt(createdAt)
  const completedFormatted = completedAt ? formatTodoCreatedAt(completedAt) : undefined

  if (isCompleted) {
    if (!completedAt || !createdAt) {
      return {
        isDone: true,
        status: "okay",
        badgeLabel: "okay",
        createdFormatted,
        completedFormatted,
      }
    }

    const createdD = new Date(createdAt)
    const completedD = new Date(completedAt)

    const createdDateStr = getLocalDateString(createdD)
    const completedDateStr = getLocalDateString(completedD)

    // Accomplished "within the day": same calendar day or within 24 hours of creation
    const isSameDay = createdDateStr === completedDateStr
    const diffMs = completedD.getTime() - createdD.getTime()
    const isWithin24Hours = diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000

    const isWithinTheDay = isSameDay || isWithin24Hours

    return {
      isDone: true,
      status: isWithinTheDay ? "okay" : "late",
      badgeLabel: isWithinTheDay ? "okay" : "late",
      createdFormatted,
      completedFormatted,
    }
  }

  // Active / in-progress task
  if (!createdAt) {
    return {
      isDone: false,
      status: "today",
      badgeLabel: "today",
      createdFormatted,
    }
  }

  const createdD = new Date(createdAt)
  const createdDateStr = getLocalDateString(createdD)
  const todayStr = getLocalDateString()

  const isOverdue = createdDateStr < todayStr

  return {
    isDone: false,
    status: isOverdue ? "overdue" : "today",
    badgeLabel: isOverdue ? "overdue" : "today",
    createdFormatted,
  }
}


