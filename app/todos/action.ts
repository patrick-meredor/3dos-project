'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'

export interface TodoItem {
  id: string
  user_id: string
  title: string
  is_completed: boolean
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

  // Normalize column names (support either is_completed or completed)
  const normalizedTodos: TodoItem[] = (data || []).map((row: any) => ({
    id: String(row.id),
    user_id: row.user_id,
    title: row.title ?? row.task ?? '',
    is_completed: Boolean(row.is_completed ?? row.completed ?? false),
    created_at: row.created_at,
  }))

  return { todos: normalizedTodos }
}

export async function addTodo(title: string): Promise<{ success: boolean; todo?: TodoItem; error?: string }> {
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

  // Try insert with is_completed
  let { data, error } = await supabase
    .from('todos')
    .insert([
      {
        user_id: user.id,
        title: cleanTitle,
        is_completed: false,
      },
    ])
    .select()
    .single()

  // Fallback in case column is named `completed` instead of `is_completed`
  if (error && error.message.includes('column "is_completed" of relation "todos" does not exist')) {
    const fallbackRes = await supabase
      .from('todos')
      .insert([
        {
          user_id: user.id,
          title: cleanTitle,
          completed: false,
        },
      ])
      .select()
      .single()
    data = fallbackRes.data
    error = fallbackRes.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/todos')
  return {
    success: true,
    todo: {
      id: String(data.id),
      user_id: data.user_id,
      title: data.title ?? cleanTitle,
      is_completed: false,
      created_at: data.created_at,
    },
  }
}

export async function updateTodo(
  id: string,
  updates: { title?: string; is_completed?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const payload: Record<string, any> = {}
  if (updates.title !== undefined) {
    payload.title = updates.title.trim()
  }
  if (updates.is_completed !== undefined) {
    payload.is_completed = updates.is_completed
  }

  let { error } = await supabase
    .from('todos')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)

  // Fallback if column is `completed`
  if (error && updates.is_completed !== undefined && error.message.includes('column "is_completed" of relation "todos" does not exist')) {
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
  return { success: true }
}
