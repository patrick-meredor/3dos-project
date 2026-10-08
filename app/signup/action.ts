'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'

export type ActionState = {
  error?: string
  success?: string
} | null

export async function signup(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  if (confirmPassword && password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // If email confirmation is disabled or auto-confirmed
  if (data?.session) {
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  return {
    success: 'Account created! If email confirmation is enabled, check your email to confirm before logging in.',
  }
}
