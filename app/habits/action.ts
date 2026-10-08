'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'

export interface HabitItem {
  id: string
  user_id: string
  title: string
  category: string
  streak: number
  completed_today: boolean
  completed_dates: string[] // Array of YYYY-MM-DD
  created_at?: string
}

const DEFAULT_STARTER_HABITS: Omit<HabitItem, 'id' | 'user_id'>[] = [
  {
    title: "Morning Sunlight & Hydration",
    category: "Morning",
    streak: 12,
    completed_today: true,
    completed_dates: [],
  },
  {
    title: "Deep Work (90 Minutes)",
    category: "Mindset",
    streak: 8,
    completed_today: false,
    completed_dates: [],
  },
  {
    title: "Read 10 Pages of Wisdom",
    category: "Evening",
    streak: 5,
    completed_today: false,
    completed_dates: [],
  },
]

export async function getHabits(): Promise<{
  habits: HabitItem[]
  tableMissing?: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { habits: [], error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    // Check if table does not exist
    if (error.code === '42P01' || error.message.includes('relation "habits" does not exist')) {
      const demoHabits: HabitItem[] = DEFAULT_STARTER_HABITS.map((h, i) => ({
        ...h,
        id: `demo-${i + 1}`,
        user_id: user.id,
      }))
      return { habits: demoHabits, tableMissing: true, error: error.message }
    }
    return { habits: [], error: error.message }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const mapped: HabitItem[] = (data || []).map((row: any) => {
    const dates = Array.isArray(row.completed_dates) ? row.completed_dates : []
    const isCompletedToday = Boolean(
      row.completed_today || dates.includes(todayStr)
    )

    return {
      id: String(row.id),
      user_id: row.user_id,
      title: row.title || 'Untitled Habit',
      category: row.category || 'General',
      streak: Number(row.streak) || 0,
      completed_today: isCompletedToday,
      completed_dates: dates,
      created_at: row.created_at,
    }
  })

  return { habits: mapped }
}

export async function addHabit(data: {
  title: string
  category?: string
}): Promise<{ success: boolean; habit?: HabitItem; error?: string }> {
  const cleanTitle = data.title.trim()
  if (!cleanTitle) {
    return { success: false, error: 'Title cannot be empty.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: inserted, error } = await supabase
    .from('habits')
    .insert([
      {
        user_id: user.id,
        title: cleanTitle,
        category: data.category || 'Morning',
        streak: 0,
        completed_today: false,
        completed_dates: [],
      },
    ])
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/habits')
  return {
    success: true,
    habit: {
      id: String(inserted.id),
      user_id: inserted.user_id,
      title: inserted.title,
      category: inserted.category,
      streak: inserted.streak ?? 0,
      completed_today: false,
      completed_dates: [],
      created_at: inserted.created_at,
    },
  }
}

export async function toggleHabitToday(
  id: string,
  currentStatus: boolean,
  currentStreak: number,
  currentDates: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const nextStatus = !currentStatus
  const nextStreak = nextStatus ? currentStreak + 1 : Math.max(0, currentStreak - 1)
  const todayStr = new Date().toISOString().split('T')[0]

  let updatedDates = [...currentDates]
  if (nextStatus) {
    if (!updatedDates.includes(todayStr)) updatedDates.push(todayStr)
  } else {
    updatedDates = updatedDates.filter((d) => d !== todayStr)
  }

  const { error } = await supabase
    .from('habits')
    .update({
      completed_today: nextStatus,
      streak: nextStreak,
      completed_dates: updatedDates,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/habits')
  return { success: true }
}

export async function deleteHabit(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/habits')
  return { success: true }
}

export async function updateHabit(
  id: string,
  data: { title?: string; category?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const payload: Record<string, any> = {}
  if (data.title !== undefined) payload.title = data.title.trim()
  if (data.category !== undefined) payload.category = data.category

  const { error } = await supabase
    .from('habits')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/habits')
  return { success: true }
}
