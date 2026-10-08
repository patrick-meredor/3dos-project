import { SignupForm } from "@/components/signup-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-signika text-sm font-medium hover:opacity-80 transition-opacity">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ArrowLeft className="size-4" />
            </div>
            Go back
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card p-12 text-center">
          <h2 className="text-4xl font-bold font-bernoru mb-4">DAY ONE</h2>
          <p className="text-muted-foreground text-lg max-w-sm">
            Join the journey. Stay consistent and achieve your goals every day.
          </p>
        </div>
      </div>
    </div>
  )
}
