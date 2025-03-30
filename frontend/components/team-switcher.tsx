"use client"
import Link from "next/link"
import { SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

export function TeamSwitcher() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link href="/dashboard" className="flex items-center justify-center p-2 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <img
              src="/starlis_cutout.svg"
              alt="Starlis Logo"
              className="h-8 w-8 text-primary flex-shrink-0 dark:brightness-0 dark:invert"
            />
            {!isCollapsed && <span className="text-2xl font-semibold flex items-center h-8">starlis.ai</span>}
          </div>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

