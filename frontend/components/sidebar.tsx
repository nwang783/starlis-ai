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
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white dark:bg-black">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center">
            <h1 className="text-xl font-bold text-foreground">Starlis</h1>
          </Link>
        </div>

        <div className="flex-1 overflow-auto py-2">
          <nav className="flex flex-col gap-2 px-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted",
                  pathname === route.href ? "bg-muted text-foreground" : "",
                )}
              >
                <route.icon className={cn("h-5 w-5", route.color)} />
                <span>{route.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <Card className="bg-muted border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <User className="h-8 w-8 rounded-full bg-background p-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">User Account</p>
                <p className="text-xs text-muted-foreground">Free Plan</p>
              </div>
            </CardContent>
          </Card>
          <Button
            variant="outline"
            className="w-full mt-4 border-black text-black hover:bg-black hover:text-white dark:border-0 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </aside>
    </>
  )
}

