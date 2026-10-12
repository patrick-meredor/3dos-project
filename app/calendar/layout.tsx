import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { getHabits } from "@/app/habits/action"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/ui/toggle"
import Link from "next/link"
import { GridBackground } from "@/components/grid-background"

export default async function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const [{ data: { user } }, { habits }] = await Promise.all([
    supabase.auth.getUser(),
    getHabits(),
  ])

  if (!user) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} habits={habits} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-4 transition-[width,height] ease-linear">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/dashboard" />}>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Calendar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>
        <GridBackground />
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
