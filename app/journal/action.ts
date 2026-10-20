'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getLocalDateString } from '@/lib/habits'
import type { JournalEntry } from '@/lib/journal'

export type { JournalEntry }

export async function getJournalEntries(): Promise<{
  entries: JournalEntry[]
  error?: string
  tableMissing?: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { entries: [], error: 'Not authenticated' }
  }

  // Query journals table
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    // If the table doesn't exist yet in Supabase (Postgres code 42P01)
    if (error.code === '42P01' || error.message.includes('relation "journals" does not exist') || error.message.includes('relation "public.journals" does not exist')) {
      return { entries: [], tableMissing: true, error: error.message }
    }
    return { entries: [], error: error.message }
  }

  // Normalize column names gracefully
  const normalizedEntries: JournalEntry[] = (data || []).map((row: any) => {
    const rawDate = row.entry_date ?? row.date ?? row.created_at
    const dateFormatted = rawDate ? String(rawDate).split('T')[0] : getLocalDateString()

    return {
      id: String(row.id),
      user_id: row.user_id,
      title: row.title ?? '',
      content: row.content ?? row.body ?? row.text ?? '',
      entry_date: dateFormatted,
      mood: row.mood ?? 'Thoughts',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  })

  return { entries: normalizedEntries }
}

export async function createJournalEntry(payload: {
  title?: string
  content: string
  entry_date?: string
  mood?: string
}): Promise<{ success: boolean; entry?: JournalEntry; error?: string }> {
  const cleanContent = payload.content.trim()
  if (!cleanContent) {
    return { success: false, error: 'Journal content cannot be empty.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const targetDate = payload.entry_date || getLocalDateString()
  const cleanTitle = (payload.title ?? '').trim()
  const cleanMood = payload.mood || 'Thoughts'

  // Attempt insert
  let { data, error } = await supabase
    .from('journals')
    .insert([
      {
        user_id: user.id,
        title: cleanTitle,
        content: cleanContent,
        entry_date: targetDate,
        mood: cleanMood,
      },
    ])
    .select()
    .single()

  // Graceful fallback if optional columns (like mood or entry_date) aren't present yet
  if (error && (error.message.includes('entry_date') || error.message.includes('mood'))) {
    const fallbackPayload: Record<string, any> = {
      user_id: user.id,
      title: cleanTitle,
      content: cleanContent,
    }
    if (!error.message.includes('entry_date')) {
      fallbackPayload.entry_date = targetDate
    } else {
      fallbackPayload.date = targetDate
    }
    const fallbackRes = await supabase.from('journals').insert([fallbackPayload]).select().single()
    data = fallbackRes.data
    error = fallbackRes.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/journal')
  revalidatePath('/dashboard')

  const createdEntry: JournalEntry = {
    id: String(data.id),
    user_id: data.user_id,
    title: data.title ?? cleanTitle,
    content: data.content ?? cleanContent,
    entry_date: data.entry_date ?? targetDate,
    mood: data.mood ?? cleanMood,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }

  return { success: true, entry: createdEntry }
}

export async function updateJournalEntry(
  id: string,
  payload: {
    title?: string
    content: string
    entry_date?: string
    mood?: string
  }
): Promise<{ success: boolean; entry?: JournalEntry; error?: string }> {
  const cleanContent = payload.content.trim()
  if (!cleanContent) {
    return { success: false, error: 'Content cannot be empty.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const updateData: Record<string, any> = {
    title: (payload.title ?? '').trim(),
    content: cleanContent,
    updated_at: new Date().toISOString(),
  }

  if (payload.entry_date) {
    updateData.entry_date = payload.entry_date
  }
  if (payload.mood) {
    updateData.mood = payload.mood
  }

  const { data, error } = await supabase
    .from('journals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/journal')
  revalidatePath('/dashboard')

  return {
    success: true,
    entry: {
      id: String(data.id),
      user_id: data.user_id,
      title: data.title ?? updateData.title,
      content: data.content ?? cleanContent,
      entry_date: data.entry_date ?? payload.entry_date ?? getLocalDateString(),
      mood: data.mood ?? payload.mood,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  }
}

export async function deleteJournalEntry(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('journals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/journal')
  revalidatePath('/dashboard')
  return { success: true }
}
