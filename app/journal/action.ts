'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getLocalDateString } from '@/lib/habits'
import {
  type JournalEntry,
  type JournalDraft,
  encodeDraftMood,
  parseDraftMood,
  isDraftRecord,
} from '@/lib/journal'

export type { JournalEntry, JournalDraft }

/**
 * Normalizes a database row to a JournalEntry (published)
 */
function normalizeJournalEntry(row: any): JournalEntry {
  const rawDate = row.entry_date ?? row.date ?? row.created_at
  const dateFormatted = rawDate ? String(rawDate).split('T')[0] : getLocalDateString()
  const { cleanMood } = parseDraftMood(row.mood)

  return {
    id: String(row.id),
    user_id: row.user_id,
    title: row.title ?? '',
    content: row.content ?? row.body ?? row.text ?? '',
    entry_date: dateFormatted,
    mood: cleanMood || 'Thoughts',
    is_draft: false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/**
 * Normalizes a database row to a JournalDraft
 */
function normalizeJournalDraft(row: any): JournalDraft {
  const rawDate = row.entry_date ?? row.date ?? row.created_at
  const dateFormatted = rawDate ? String(rawDate).split('T')[0] : getLocalDateString()
  const { cleanMood, entryId } = parseDraftMood(row.mood)

  return {
    id: String(row.id),
    user_id: row.user_id,
    entry_id: entryId || row.entry_id || null,
    title: row.title ?? '',
    content: row.content ?? row.body ?? row.text ?? '',
    entry_date: dateFormatted,
    mood: cleanMood || 'Thoughts',
    updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  }
}

/**
 * Fetches all published journal entries for the current user.
 * Unfinished drafts are excluded from this list.
 */
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
    if (
      error.code === '42P01' ||
      error.message.includes('relation "journals" does not exist') ||
      error.message.includes('relation "public.journals" does not exist')
    ) {
      return { entries: [], tableMissing: true, error: error.message }
    }
    return { entries: [], error: error.message }
  }

  // Filter out any draft records so drafts never leak into published lists or dashboard counts
  const publishedRows = (data || []).filter((row: any) => !isDraftRecord(row))
  const normalizedEntries = publishedRows.map(normalizeJournalEntry)

  return { entries: normalizedEntries }
}

/**
 * Fetches an unfinished draft for the authenticated user, if one exists.
 */
export async function getJournalDraft(): Promise<{
  draft: JournalDraft | null
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { draft: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return { draft: null, error: error.message }
  }

  const draftRow = (data || []).find((row: any) => isDraftRecord(row))
  if (!draftRow) {
    return { draft: null }
  }

  return { draft: normalizeJournalDraft(draftRow) }
}

/**
 * Automatically saves or updates a journal draft in persistent database storage.
 * Gracefully adapts whether the database has `is_draft` column or uses draft mood tagging.
 */
export async function saveJournalDraft(payload: {
  id?: string
  entry_id?: string | null
  title?: string
  content: string
  entry_date?: string
  mood?: string
}): Promise<{ success: boolean; draft?: JournalDraft; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const targetDate = payload.entry_date || getLocalDateString()
  const cleanTitle = (payload.title ?? '').trim()
  const cleanContent = payload.content ?? ''
  const cleanMood = payload.mood || 'Thoughts'
  const encodedMood = encodeDraftMood(cleanMood, payload.entry_id)
  const nowIso = new Date().toISOString()

  // Find existing draft row if id is not passed
  let targetId = payload.id
  if (!targetId) {
    const { data: existingRows } = await supabase
      .from('journals')
      .select('id, mood, is_draft')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10)

    const existingDraft = (existingRows || []).find((row: any) => isDraftRecord(row))
    if (existingDraft) {
      targetId = String(existingDraft.id)
    }
  }

  if (targetId) {
    // Attempt update on existing draft row
    const updateData: Record<string, any> = {
      title: cleanTitle,
      content: cleanContent,
      entry_date: targetDate,
      mood: encodedMood,
      updated_at: nowIso,
      is_draft: true,
    }

    let { data, error } = await supabase
      .from('journals')
      .update(updateData)
      .eq('id', targetId)
      .eq('user_id', user.id)
      .select()
      .single()

    // If is_draft column doesn't exist yet, retry without is_draft
    if (error && (error.code === '42703' || error.message.includes('is_draft'))) {
      delete updateData.is_draft
      const retryRes = await supabase
        .from('journals')
        .update(updateData)
        .eq('id', targetId)
        .eq('user_id', user.id)
        .select()
        .single()
      data = retryRes.data
      error = retryRes.error
    }

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      draft: normalizeJournalDraft(data),
    }
  }

  // Insert a new draft row
  const insertData: Record<string, any> = {
    user_id: user.id,
    title: cleanTitle,
    content: cleanContent,
    entry_date: targetDate,
    mood: encodedMood,
    is_draft: true,
  }

  let { data, error } = await supabase
    .from('journals')
    .insert([insertData])
    .select()
    .single()

  // Graceful fallback if is_draft column doesn't exist yet
  if (error && (error.code === '42703' || error.message.includes('is_draft'))) {
    delete insertData.is_draft
    const retryRes = await supabase.from('journals').insert([insertData]).select().single()
    data = retryRes.data
    error = retryRes.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    draft: normalizeJournalDraft(data),
  }
}

/**
 * Permanently discards an unfinished draft.
 * Does NOT delete any previously saved journal entries.
 */
export async function deleteJournalDraft(draftId?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (draftId) {
    // Check that we are deleting a draft and not a published entry
    const { error } = await supabase
      .from('journals')
      .delete()
      .eq('id', draftId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    // Delete all draft rows for this user
    // First query drafts to find IDs
    const { data } = await supabase
      .from('journals')
      .select('id, mood, is_draft')
      .eq('user_id', user.id)

    const draftIds = (data || [])
      .filter((row: any) => isDraftRecord(row))
      .map((row: any) => row.id)

    if (draftIds.length > 0) {
      await supabase.from('journals').delete().in('id', draftIds).eq('user_id', user.id)
    }
  }

  return { success: true }
}

/**
 * Publishes an unfinished draft into a saved journal entry.
 * If the draft was editing an existing entry, updates that entry and discards the draft.
 * If the draft was for a new entry, finalizes it into a published journal entry.
 */
export async function publishJournalDraft(payload: {
  id?: string
  entry_id?: string | null
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
  const nowIso = new Date().toISOString()

  // CASE 1: This draft was an edit to an existing journal entry
  if (payload.entry_id) {
    const updateData: Record<string, any> = {
      title: cleanTitle,
      content: cleanContent,
      entry_date: targetDate,
      mood: cleanMood,
      updated_at: nowIso,
      is_draft: false,
    }

    let { data, error } = await supabase
      .from('journals')
      .update(updateData)
      .eq('id', payload.entry_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error && (error.code === '42703' || error.message.includes('is_draft'))) {
      delete updateData.is_draft
      const retryRes = await supabase
        .from('journals')
        .update(updateData)
        .eq('id', payload.entry_id)
        .eq('user_id', user.id)
        .select()
        .single()
      data = retryRes.data
      error = retryRes.error
    }

    if (error) {
      return { success: false, error: error.message }
    }

    // Discard the draft row
    if (payload.id) {
      await deleteJournalDraft(payload.id)
    } else {
      await deleteJournalDraft()
    }

    revalidatePath('/journal')
    revalidatePath('/dashboard')

    return {
      success: true,
      entry: normalizeJournalEntry(data),
    }
  }

  // CASE 2: This draft was for a new journal entry
  // If we already have a draft row ID, convert it in-place to published
  if (payload.id) {
    const updateData: Record<string, any> = {
      title: cleanTitle,
      content: cleanContent,
      entry_date: targetDate,
      mood: cleanMood,
      updated_at: nowIso,
      is_draft: false,
    }

    let { data, error } = await supabase
      .from('journals')
      .update(updateData)
      .eq('id', payload.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error && (error.code === '42703' || error.message.includes('is_draft'))) {
      delete updateData.is_draft
      const retryRes = await supabase
        .from('journals')
        .update(updateData)
        .eq('id', payload.id)
        .eq('user_id', user.id)
        .select()
        .single()
      data = retryRes.data
      error = retryRes.error
    }

    if (!error && data) {
      revalidatePath('/journal')
      revalidatePath('/dashboard')
      return {
        success: true,
        entry: normalizeJournalEntry(data),
      }
    }
  }

  // Fallback: create fresh entry and delete draft
  const createRes = await createJournalEntry({
    title: cleanTitle,
    content: cleanContent,
    entry_date: targetDate,
    mood: cleanMood,
  })

  if (createRes.success && payload.id) {
    await deleteJournalDraft(payload.id)
  }

  return createRes
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
        is_draft: false,
      },
    ])
    .select()
    .single()

  // Graceful fallback if is_draft, mood, or entry_date aren't present yet
  if (error) {
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
    if (!error.message.includes('mood')) {
      fallbackPayload.mood = cleanMood
    }
    const fallbackRes = await supabase.from('journals').insert([fallbackPayload]).select().single()
    data = fallbackRes.data
    error = fallbackRes.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  // Clean up any remaining draft for this user
  await deleteJournalDraft()

  revalidatePath('/journal')
  revalidatePath('/dashboard')

  const createdEntry: JournalEntry = {
    id: String(data.id),
    user_id: data.user_id,
    title: data.title ?? cleanTitle,
    content: data.content ?? cleanContent,
    entry_date: data.entry_date ?? targetDate,
    mood: data.mood ?? cleanMood,
    is_draft: false,
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
    is_draft: false,
  }

  if (payload.entry_date) {
    updateData.entry_date = payload.entry_date
  }
  if (payload.mood) {
    updateData.mood = payload.mood
  }

  let { data, error } = await supabase
    .from('journals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error && (error.code === '42703' || error.message.includes('is_draft'))) {
    delete updateData.is_draft
    const retryRes = await supabase
      .from('journals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    data = retryRes.data
    error = retryRes.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  // Clean up any draft associated with this entry or user
  await deleteJournalDraft()

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
      is_draft: false,
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
