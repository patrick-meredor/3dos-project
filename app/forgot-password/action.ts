'use server'

import { createClient } from '@/lib/server'
import { headers } from 'next/headers'

export type ActionState = {
  error?: string
  success?: string
} | null

export async function forgotPassword(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Please enter your email address.' }
  }

  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || 'localhost:3000'
  const protocol = headerList.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: 'Password reset link sent! Please check your email inbox to reset your password.',
  }
}
