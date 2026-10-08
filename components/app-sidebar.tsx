"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import {
  LayoutDashboard,
  Map,
  Target,
  Sparkles,
  LogOut,
  ChevronUp,
  User as UserIcon,
  Home,
  CheckCircle2,
  List,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/ui/toggle"
import { signOut } from "@/app/login/action"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: SupabaseUser | null
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const mainNav = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Habits",
      url: "/habits",
      icon: Target,
    },
    {
      title: "Todos",
      url: "/todos",
      icon: List,
    },
  ]

  const habits = [
    { name: "Morning Exercise", streak: "12d" },
    { name: "Deep Work (2 hrs)", streak: "8d" },
    { name: "Reading 20 Pages", streak: "5d" },
  ]

  const userEmail = user?.email ?? "user@example.com"
  const userInitial = userEmail.charAt(0).toUpperCase()
  const userName = userEmail.split("@")[0]

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Brand Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Image
                  src="/logo_transparent.png"
                  alt="Day One"
                  width={24}
                  height={24}
                  className="dark:invert"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold font-bernoru tracking-wide">DAY ONE</span>
                <span className="truncate text-xs text-muted-foreground">Keep Doing Good</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent>
        {/* Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    render={<Link href={item.url} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Daily Habits / Consistency Preview */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="flex items-center justify-between">
            <Link href="/habits" className="hover:text-foreground transition-colors flex items-center justify-between w-full">
              <span>Daily Streaks</span>
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {habits.map((habit) => (
                <SidebarMenuItem key={habit.name}>
                  <SidebarMenuButton size="sm" className="cursor-default hover:bg-transparent">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="flex-1 truncate text-xs">{habit.name}</span>
                    <span className="text-[10px] font-semibold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                      {habit.streak}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User & Settings Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                </div>
                <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="end"
                className="w-56 rounded-lg p-2"
              >
                <div className="flex items-center gap-2 p-2">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/habits" className="flex items-center gap-2 w-full" />}>
                  <Target className="size-4" />
                  <span>My Habits</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/todos" className="flex items-center gap-2 w-full" />}>
                  <List className="size-4" />
                  <span>Todos</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/" className="flex items-center gap-2 w-full" />}>
                  <Home className="size-4" />
                  <span>Landing Page</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-destructive cursor-pointer"
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
