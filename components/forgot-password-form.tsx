"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Loader2, Mail, CheckCircle2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { forgotPassword } from "@/app/forgot-password/action"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction, isPending] = useActionState(forgotPassword, null)
  const [submittedEmail, setSubmittedEmail] = useState("")

  if (state?.success) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-signika tracking-tight">
            Check your email
          </h1>
          <p className="text-xs sm:text-sm text-balance text-muted-foreground">
            We sent a password reset link to{" "}
            {submittedEmail ? (
              <span className="font-medium text-foreground">{submittedEmail}</span>
            ) : (
              "your email address"
            )}
            . Please click the link to reset your password.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
          Didn&apos;t receive an email? Check your spam folder, or make sure the email address you entered is associated with an account.
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send another link
          </Button>

          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }), "w-full flex items-center justify-center gap-1.5")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        if (email) setSubmittedEmail(email)
      }}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl sm:text-2xl font-bold font-signika tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-xs sm:text-sm text-balance text-muted-foreground">
            Enter your email below and we&apos;ll send you a reset link
          </p>
        </div>

        {state?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive font-medium">
            {state.error}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            required
            disabled={isPending}
          />
        </Field>

        <Field>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Sending link..." : "Send reset link"}
          </Button>

          <FieldDescription className="text-center mt-3">
            Remember your password?{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 font-medium text-foreground hover:text-primary transition-colors"
            >
              Login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
