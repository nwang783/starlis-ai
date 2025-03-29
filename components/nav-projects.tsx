"use client"

import { ArrowUpRight, Forward, MessageSquare, MoreHorizontal, PlusCircle, Trash2, type LucideIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export function NavConversations({
  projects,
}: {
  projects: {
    name: string
    url?: string
    id?: string
    icon?: LucideIcon
  }[]
}) {
  const { isMobile } = useSidebar()

  return (
    <>
      <Button
        variant="outline"
        className="mb-2 w-full justify-start"
        onClick={() => (window.location.href = "/assistant")}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        New chat
      </Button>

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between px-2 py-1.5">
          <SidebarGroupLabel className="p-0">Conversations</SidebarGroupLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => (window.location.href = "/dashboard")}
          >
            View all
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <SidebarMenu>
          {projects.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <a href={item.url || `/assistant?chat=${item.id || Math.random().toString(36).substring(2, 9)}`}>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <MessageSquare className="text-muted-foreground" />
                    <span>Continue Chat</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Forward className="text-muted-foreground" />
                    <span>Share Conversation</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Trash2 className="text-muted-foreground" />
                    <span>Delete Conversation</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
          {projects.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No conversations yet</div>
          )}
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}

