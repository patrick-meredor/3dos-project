/**
 * Helper utilities for formatting and handling Todo dates.
 */

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
  const todayStr = today.toISOString().split("T")[0]

  // Extract YYYY-MM-DD whether it is an ISO timestamp or date string
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split("T")[0]

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
