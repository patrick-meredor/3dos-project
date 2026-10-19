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

export default async function DashboardLayout({
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
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between px-3 sm:px-4 transition-[width,height] ease-linear">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <SidebarTrigger className="-ml-1 size-8 sm:size-9" />
            <Breadcrumb>
              <BreadcrumbList className="text-xs sm:text-sm">
                <BreadcrumbItem className="hidden xs:inline-flex">
                  <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden xs:inline-flex" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
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
