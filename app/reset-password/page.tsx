import { ResetPasswordForm } from "@/components/reset-password-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/server"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password | Day One",
  description: "Set a new password for your Day One account",
}

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link
            href="/login"
            className="flex items-center gap-2 font-signika text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ArrowLeft className="size-4" />
            </div>
            Back to login
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ResetPasswordForm isAuthenticated={!!user} />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:flex items-center justify-center border-l p-12">
        <div className="max-w-md text-center space-y-4">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo_transparent.png"
              alt="Day One Logo"
              width={80}
              height={80}
              className="dark:invert"
            />
          </div>
          <h2 className="text-4xl font-bold font-bernoru tracking-tight">DAY ONE</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Protect your progress. Set your new password and keep crushing your daily goals.
          </p>
        </div>
      </div>
    </div>
  )
}
