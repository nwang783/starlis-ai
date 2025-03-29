"use client"
import Link from "next/link"
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link href="/dashboard" className="flex items-center justify-center p-2 hover:opacity-80 transition-opacity">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/starlis%20logo-3pmqJPzAWlOhFnPrT8vTnGc2SXVGv8.svg"
            alt="Starlis"
            className="h-10 w-10"
          />
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

