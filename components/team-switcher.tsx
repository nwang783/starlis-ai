"use client"
import Link from "next/link"
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link href="/dashboard" className="flex items-center justify-center p-2 hover:opacity-80 transition-opacity">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.2" />
            <path
              d="M12 14L20 8L28 14V26L20 32L12 26V14Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M20 20L28 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 20V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 20L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

