"use client"

import { User, ChevronDown, LogOut, Moon, Sun } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { signOutUser, updateUserData } from "@/lib/firebase"
import { getGravatarUrl } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { userData } = useAuth()
  const router = useRouter()
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Update the switch state when the theme changes
  useEffect(() => {
    // Set dark mode as default
    if (typeof window !== "undefined") {
      // First check if we have a user preference in Firestore
      if (userData && userData.themePreference !== undefined) {
        const isDark = userData.themePreference === "dark"
        setIsDarkMode(isDark)
        setTheme(isDark ? "dark" : "light")

        // Update the HTML class
        const html = document.documentElement
        if (isDark) {
          html.classList.add("dark")
        } else {
          html.classList.remove("dark")
        }
      } else {
        // Default to dark mode if no preference is saved
        setIsDarkMode(true)
        setTheme("dark")
        document.documentElement.classList.add("dark")

        // Save the default preference to Firestore if we have a user
        if (userData && userData.userId) {
          updateUserData(userData.userId, { themePreference: "dark" }).catch((error) =>
            console.error("Error saving theme preference:", error),
          )
        }
      }
    }
  }, [userData, setTheme])

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked)
    setTheme(checked ? "dark" : "light")

    // Update the HTML class
    if (typeof window !== "undefined") {
      const html = document.documentElement
      if (checked) {
        html.classList.add("dark")
      } else {
        html.classList.remove("dark")
      }
    }

    // Save the preference to Firestore
    if (userData && userData.userId) {
      updateUserData(userData.userId, { themePreference: checked ? "dark" : "light" }).catch((error) =>
        console.error("Error saving theme preference:", error),
      )
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (!userData) {
    return null
  }

  const user = {
    name: `${userData.firstName} ${userData.lastName}`,
    email: userData.email,
    avatar: getGravatarUrl(userData.email),
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {userData.firstName[0]}
                  {userData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronDown
                className={`ml-auto size-4 transition-transform duration-200 ${isOpen ? "-rotate-90" : ""}`}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {userData.firstName[0]}
                    {userData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  toggleDarkMode(!isDarkMode)
                }}
                className="flex cursor-default justify-between"
              >
                <div className="flex items-center gap-2">
                  {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span className="text-sm">Dark Mode</span>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} onClick={(e) => e.stopPropagation()} />
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

