"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Phone, MessageSquare, Settings, User, BarChart3, Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-mobile"

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Calls",
    icon: Phone,
    href: "/calls",
    color: "text-violet-500",
  },
  {
    label: "Assistant",
    icon: MessageSquare,
    href: "/assistant",
    color: "text-pink-700",
  },
  {
    label: "Usage",
    icon: BarChart3,
    href: "/usage",
    color: "text-orange-700",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500",
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    } else {
      setIsOpen(true)
    }
  }, [isMobile])

  if (!isMounted) {
    return null
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col w-72 bg-white border-r shadow-sm transition-transform duration-300 ease-in-out",
          isMobile && !isOpen && "-translate-x-full",
        )}
      >
        <div className="p-4 border-b">
          <Link href="/dashboard" className="flex items-center">
            <h1 className="text-xl font-bold">Starlis</h1>
          </Link>
        </div>

        <div className="flex-1 overflow-auto py-2">
          <nav className="flex flex-col gap-2 px-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100",
                  pathname === route.href ? "bg-gray-100 text-gray-900" : "",
                )}
              >
                <route.icon className={cn("h-5 w-5", route.color)} />
                <span>{route.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t mt-auto">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <User className="h-8 w-8 rounded-full bg-gray-200 p-1" />
              <div>
                <p className="text-sm font-medium">User Account</p>
                <p className="text-xs text-gray-500">Free Plan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

