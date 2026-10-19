"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { updatePassword } from "@/app/reset-password/action"

interface ResetPasswordFormProps extends React.ComponentProps<"form"> {
  isAuthenticated?: boolean
}

export function ResetPasswordForm({
  className,
  isAuthenticated = true,
  ...props
}: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(updatePassword, null)

  if (!isAuthenticated) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-signika tracking-tight">
            Invalid or Expired Link
          </h1>
          <p className="text-xs sm:text-sm text-balance text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new link to reset your password.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/forgot-password"
            className={cn(buttonVariants({ variant: "default" }), "w-full text-center")}
          >
            Request new reset link
          </Link>

          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }), "w-full text-center")}
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl sm:text-2xl font-bold font-signika tracking-tight">
            Set new password
          </h1>
          <p className="text-xs sm:text-sm text-balance text-muted-foreground">
            Enter your new password below to update your account
          </p>
        </div>

        {state?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive font-medium">
            {state.error}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="password">New Password</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Repeat new password"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </Field>

        <Field>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Updating password..." : "Update password"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
