"use client"

import { useState, useEffect } from "react"
import { Home, PlusCircle, Settings, ChevronUp, MessageCircle, LogOut, User, Moon, Sun } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { getUserConversations } from "@/lib/firebase/conversations"
import { getGravatarUrl } from "@/lib/utils"
import { signOutUser } from "@/lib/firebase"

export function BottomNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user: firebaseUser, userData } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { theme, setTheme } = useTheme()

  // Fetch conversations when component mounts or when drawer opens
  useEffect(() => {
    const fetchConversations = async () => {
      if (!firebaseUser) return
      try {
        const userConversations = await getUserConversations(firebaseUser.uid)
        setConversations(userConversations)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isDrawerOpen) {
      fetchConversations()
    }
  }, [firebaseUser, isDrawerOpen])

  const handleSignOut = async () => {
    try {
      await signOutUser()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (!userData) return null

  const userProfile = {
    name: `${userData.firstName} ${userData.lastName}`,
    email: userData.email,
    avatar: getGravatarUrl(userData.email),
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around px-4">
        {/* Dashboard Button */}
        <Link href="/dashboard" className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10",
              pathname === "/dashboard" && "text-primary"
            )}
          >
            <Home className="h-5 w-5" />
          </Button>
        </Link>

        {/* New Chat Button */}
        <Link href="/assistant" className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </Link>

        {/* Drawer Trigger */}
        <div className="flex flex-col items-center">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[90vh]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Access all your navigation options
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Main Navigation */}
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/assistant">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Conversation
                  </Button>
                </Link>
                <Link href="/conversations">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    All Conversations
                  </Button>
                </Link>
                
                {/* Recent Conversations Section */}
                <div className="space-y-2">
                  <h3 className="px-4 text-sm font-medium text-muted-foreground">Recent Conversations</h3>
                  <div className="space-y-1">
                    {isLoading ? (
                      <div className="px-4 py-2 text-sm text-muted-foreground">Loading conversations...</div>
                    ) : conversations.length > 0 ? (
                      conversations.slice(0, 5).map((conversation) => (
                        <Link 
                          key={conversation.id} 
                          href={`/assistant?chat=${conversation.id}`}
                          className="block"
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {conversation.name}
                          </Button>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-muted-foreground">No conversations yet</div>
                    )}
                  </div>
                </div>

                {/* User Profile Section */}
                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-2"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-2"
                    onClick={() => {
                      setIsDrawerOpen(false)
                      setIsUserMenuOpen(true)
                    }}
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                      <AvatarFallback>
                        {userData.firstName[0]}
                        {userData.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{userProfile.name}</span>
                      <span className="text-xs text-muted-foreground">{userProfile.email}</span>
                    </div>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Settings Button */}
        <Link href="/settings" className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10",
              pathname === "/settings" && "text-primary"
            )}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </Link>

        {/* Account Button */}
        <div className="flex flex-col items-center">
          <Sheet open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10",
                  pathname === "/account" && "text-primary"
                )}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                  <AvatarFallback>
                    {userData.firstName[0]}
                    {userData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh]">
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                    <AvatarFallback>
                      {userData.firstName[0]}
                      {userData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{userProfile.name}</SheetTitle>
                    <SheetDescription>{userProfile.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <Link href="/account">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
} 