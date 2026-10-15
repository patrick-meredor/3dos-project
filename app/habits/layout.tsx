import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { getHabits } from "@/app/habits/action"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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

export default async function HabitsLayout({
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
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b px-3 sm:px-4 transition-[width,height] ease-linear">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <SidebarTrigger className="-ml-1 size-8 sm:size-9" />
            <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4 hidden xs:block" />
            <Breadcrumb>
              <BreadcrumbList className="text-xs sm:text-sm">
                <BreadcrumbItem className="hidden xs:inline-flex">
                  <BreadcrumbLink render={<Link href="/dashboard" />}>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden xs:inline-flex" />
                <BreadcrumbItem>
                  <BreadcrumbPage>My Habits</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>
        <GridBackground />
        <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-3 sm:p-6 md:p-8 overflow-x-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
