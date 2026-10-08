import { LoginForm } from "@/components/login-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
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
            <LoginForm />
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
            Every journey begins with a single choice. Stay consistent, build momentum, and keep doing good every single day.
          </p>
        </div>
      </div>
    </div>
  )
}
