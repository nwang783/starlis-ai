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
          <div className="flex flex-col items-center gap-2">
            <img
              src="/starlis_cutout.svg"
              alt="Starlis Logo"
              className={`text-primary flex-shrink-0 dark:brightness-0 dark:invert transition-all duration-500 ease-in-out ${isCollapsed ? 'h-10 w-10' : 'h-16 w-16'}`}
            />
            {!isCollapsed && <span className="text-2xl font-semibold transition-opacity duration-500 ease-in-out">starlis</span>}
          </div>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

