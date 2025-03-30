"use client"

import type { LucideIcon } from "lucide-react"
import { Zap } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  // The NavMain component no longer renders the Platform section
  return null
}

// Create a new component for the Platform section
export function NavPlatform({
  items,
}: {
  items: NavItem[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className={cn(
                      "group relative w-full transition-colors duration-200 ease-in-out",
                      "hover:bg-accent/50",
                      "dark:hover:bg-accent/50",
                      "z-50"
                    )}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild
                          className={cn(
                            "group relative w-full transition-colors duration-200 ease-in-out",
                            "hover:bg-accent/50",
                            "dark:hover:bg-accent/50",
                            "z-50"
                          )}
                        >
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className={cn(
                  "group relative w-full transition-colors duration-200 ease-in-out",
                  "hover:bg-accent/50",
                  "dark:hover:bg-accent/50",
                  "z-50"
                )}
              >
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
        {/* Add Sandbox option after the mapped items */}
        <SidebarMenuItem>
          <SidebarMenuButton 
            asChild 
            tooltip="Sandbox"
            className={cn(
              "group relative w-full transition-colors duration-200 ease-in-out",
              "hover:bg-accent/50",
              "dark:hover:bg-accent/50",
              "z-50"
            )}
          >
            <a href="/sandbox">
              <Zap />
              <span>Sandbox</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

