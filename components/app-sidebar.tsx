"use client"

import type * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  Users,
} from "lucide-react"

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"

// This is sample data.
const data = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  teams: [
    {
      name: "Personal",
      logo: GalleryVerticalEnd,
      plan: "Pro",
    },
    {
      name: "Acme Inc",
      logo: AudioWaveform,
      plan: "Enterprise",
    },
    {
      name: "Startup Co.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Assistant",
      url: "/dashboard",
      icon: Bot,
      isActive: true,
      items: [
        {
          title: "Chat History",
          url: "/dashboard/history",
        },
        {
          title: "Saved Chats",
          url: "/dashboard/saved",
        },
      ],
    },
    {
      title: "Meetings",
      url: "/dashboard/meetings",
      icon: Command,
      items: [
        {
          title: "Upcoming",
          url: "/dashboard/meetings/upcoming",
        },
        {
          title: "Past",
          url: "/dashboard/meetings/past",
        },
        {
          title: "Calendar",
          url: "/dashboard/meetings/calendar",
        },
      ],
    },
    {
      title: "Emails",
      url: "/dashboard/emails",
      icon: BookOpen,
      items: [
        {
          title: "Inbox",
          url: "/dashboard/emails/inbox",
        },
        {
          title: "Sent",
          url: "/dashboard/emails/sent",
        },
        {
          title: "Drafts",
          url: "/dashboard/emails/drafts",
        },
      ],
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: Users,
      items: [],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Integrations",
          url: "/dashboard/settings/integrations",
        },
        {
          title: "Billing",
          url: "/dashboard/settings/billing",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Voice Calls",
      url: "/dashboard/voice",
      icon: Frame,
    },
    {
      name: "Analytics",
      url: "/dashboard/analytics",
      icon: PieChart,
    },
    {
      name: "Extensions",
      url: "/dashboard/extensions",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

