"use client"

import type * as React from "react"
import { ArrowLeft, Phone, PieChart, Settings2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

import { NavPlatform } from "./nav-main"
import { NavConversations } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userData } = useAuth()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const sidebar = useSidebar()

  // Update local state when sidebar state changes
  useEffect(() => {
    if (sidebar) {
      setIsCollapsed(!!sidebar.collapsed)
    }
  }, [sidebar])

  // Default data for navigation
  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: PieChart,
        isActive: pathname === "/dashboard",
      },
      {
        title: "Calls",
        url: "/calls",
        icon: Phone,
        isActive: pathname === "/calls",
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings2,
        isActive: pathname === "/settings",
      },
    ],
    projects: [
      {
        name: "How to implement authentication in Next.js?",
        url: "/assistant?chat=1",
        id: "1",
      },
      {
        name: "Explain database indexing strategies",
        url: "/assistant?chat=2",
        id: "2",
      },
      {
        name: "Help me debug my React component",
        url: "/assistant?chat=3",
        id: "3",
      },
      {
        name: "Best practices for API design",
        url: "/assistant?chat=4",
        id: "4",
      },
      {
        name: "Optimizing React performance",
        url: "/assistant?chat=5",
        id: "5",
      },
      {
        name: "Setting up CI/CD pipeline",
        url: "/assistant?chat=6",
        id: "6",
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" className="bg-background dark:bg-black shadow-lg transition-all duration-200" {...props}>
      <SidebarHeader className="mt-12 pb-16">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavConversations projects={data.projects} />
        <NavPlatform items={data.navMain} />
      </SidebarContent>

      {/* Custom button with SidebarTrigger for functionality */}
      <div className="py-2 px-3">
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mx-auto block w-fit">
                  <SidebarTrigger className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </SidebarTrigger>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Expand Sidebar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <SidebarTrigger className="hidden flex w-full items-center justify-start rounded-md px-1 py-1 hover:bg-accent hover:text-accent-foreground">
            <span className="mr-2">Collapse Sidebar</span>
            <ArrowLeft className="h-4 w-4" />
          </SidebarTrigger>
        )}
      </div>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

