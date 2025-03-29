"use client"

import type * as React from "react"
import { BarChart3, Phone, PieChart, Settings2 } from "lucide-react"
import { usePathname } from "next/navigation"

import { NavPlatform } from "./nav-main"
import { NavConversations } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userData } = useAuth()
  const pathname = usePathname()

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
        title: "Usage",
        url: "/usage",
        icon: BarChart3,
        isActive: pathname === "/usage",
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings2,
        isActive: pathname === "/settings" || pathname.startsWith("/settings/"),
        items: [
          {
            title: "General",
            url: "/settings",
          },
          {
            title: "Integrations",
            url: "/settings?tab=integrations",
          },
          {
            title: "Mail Settings",
            url: "/settings?tab=mail",
          },
          {
            title: "Security",
            url: "/settings?tab=security",
          },
        ],
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
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavConversations projects={data.projects} />
        <NavPlatform items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

