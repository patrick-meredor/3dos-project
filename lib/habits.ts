/**
 * Helper utilities for habit completion and streak calculation.
 */

/**
 * Calculates the current consecutive daily streak from a list of completed date strings (YYYY-MM-DD).
 * - If completed today: counts today + consecutive past days (yesterday, day before...).
 * - If NOT completed today:
 *     - If completed yesterday: counts consecutive past days starting from yesterday (streak is still active for today).
 *     - If missed yesterday: streak has broken, returns 0.
 */
export function calculateStreak(completedDates: string[], fallbackStreak: number = 0): number {
  if (!Array.isArray(completedDates) || completedDates.length === 0) {
    return fallbackStreak
  }

  const datesSet = new Set(completedDates)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const isCompletedToday = datesSet.has(todayStr)
  const isCompletedYesterday = datesSet.has(yesterdayStr)

  // If not completed today and missed yesterday, streak is broken
  if (!isCompletedToday && !isCompletedYesterday) {
    return 0
  }

  let streak = 0
  const checkDate = new Date(isCompletedToday ? today : yesterday)

  while (datesSet.has(checkDate.toISOString().split('T')[0])) {
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  return streak
}

/**
 * Generates an array of past date strings (YYYY-MM-DD) for demo/starter habits.
 */
export function generatePastDates(days: number, includeToday: boolean): string[] {
  const dates: string[] = []
  const today = new Date()
  const startOffset = includeToday ? 0 : 1
  for (let i = startOffset; i < days + startOffset; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}
