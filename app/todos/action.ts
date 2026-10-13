'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getLocalDateString } from '@/lib/habits'

export interface TodoItem {
  id: string
  user_id: string
  title: string
  is_completed: boolean
  due_date?: string
  completed_at?: string
  created_at?: string
}

export async function getTodos(): Promise<{ todos: TodoItem[]; error?: string; tableMissing?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { todos: [], error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    // If the table doesn't exist yet in Supabase (Postgres code 42P01)
    if (error.code === '42P01' || error.message.includes('relation "todos" does not exist')) {
      return { todos: [], tableMissing: true, error: error.message }
    }
    return { todos: [], error: error.message }
  }

  // Normalize column names and dates (supports due_date, date, or created_at)
  const normalizedTodos: TodoItem[] = (data || []).map((row: any) => {
    const rawDate = row.due_date ?? row.date ?? row.created_at
    const dateFormatted = rawDate ? String(rawDate).split('T')[0] : undefined

    return {
      id: String(row.id),
      user_id: row.user_id,
      title: row.title ?? row.task ?? '',
      is_completed: Boolean(row.is_completed ?? row.completed ?? false),
      due_date: dateFormatted,
      completed_at: row.completed_at ? String(row.completed_at) : undefined,
      created_at: row.created_at,
    }
  })

  return { todos: normalizedTodos }
}

export async function addTodo(
  title: string,
  dueDate?: string
): Promise<{ success: boolean; todo?: TodoItem; error?: string }> {
  const cleanTitle = title.trim()
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

  const targetDate = dueDate || getLocalDateString()

  // Try insert with due_date and is_completed
  let { data, error } = await supabase
    .from('todos')
    .insert([
      {
        user_id: user.id,
        title: cleanTitle,
        is_completed: false,
        due_date: targetDate,
      },
    ])
    .select()
    .single()

  // Graceful fallback if due_date column does not exist yet in table
  if (error && (error.message.includes('due_date') || error.message.includes('is_completed'))) {
    const payload: Record<string, any> = {
      user_id: user.id,
      title: cleanTitle,
      is_completed: false,
    }

    let fallbackRes = await supabase.from('todos').insert([payload]).select().single()
    if (fallbackRes.error && fallbackRes.error.message.includes('is_completed')) {
      delete payload.is_completed
      payload.completed = false
      fallbackRes = await supabase.from('todos').insert([payload]).select().single()
    }
    data = fallbackRes.data
    error = fallbackRes.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/todos')
  revalidatePath('/dashboard')
  return {
    success: true,
    todo: {
      id: String(data.id),
      user_id: data.user_id,
      title: data.title ?? cleanTitle,
      is_completed: false,
      due_date: data.due_date ? String(data.due_date).split('T')[0] : targetDate,
      completed_at: undefined,
      created_at: data.created_at,
    },
  }
}

export async function updateTodo(
  id: string,
  updates: {
    title?: string
    is_completed?: boolean
    completed_at?: string | null
    due_date?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Prevent editing completed todos
  if (updates.title !== undefined || updates.due_date !== undefined) {
    const { data: existing } = await supabase
      .from('todos')
      .select('is_completed')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.is_completed) {
      return { success: false, error: 'Completed tasks cannot be edited.' }
    }
  }

  const payload: Record<string, any> = {}
  if (updates.title !== undefined) {
    payload.title = updates.title.trim()
  }
  if (updates.is_completed !== undefined) {
    payload.is_completed = updates.is_completed
    if (updates.is_completed) {
      payload.completed_at = updates.completed_at ?? new Date().toISOString()
    } else {
      payload.completed_at = null
    }
  } else if (updates.completed_at !== undefined) {
    payload.completed_at = updates.completed_at
  }
  if (updates.due_date !== undefined) {
    payload.due_date = updates.due_date
  }

  let { error } = await supabase
    .from('todos')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)

  // Fallback if column completed_at does not exist yet
  if (error && payload.completed_at !== undefined && error.message.includes('completed_at')) {
    delete payload.completed_at
    const fallback = await supabase
      .from('todos')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
    error = fallback.error
  }

  // Fallback if column due_date does not exist
  if (error && updates.due_date !== undefined && error.message.includes('due_date')) {
    delete payload.due_date
    const fallback = await supabase
      .from('todos')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
    error = fallback.error
  }

  // Fallback if column is completed instead of is_completed
  if (error && updates.is_completed !== undefined && error.message.includes('is_completed')) {
    delete payload.is_completed
    payload.completed = updates.is_completed
    const fallback = await supabase
      .from('todos')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
    error = fallback.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/todos')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTodo(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/todos')
  revalidatePath('/dashboard')
  return { success: true }
}
