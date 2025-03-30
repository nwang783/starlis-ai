"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "../../components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  User,
  Bell,
  Sun,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { createNewChat } from "@/lib/firebase"
import { getUpcomingMeetings, type Meeting } from "@/lib/placeholders"
import { TimeBasedArt } from "@/components/time-based-art"

// Sample call history data - in a real app, this would come from your backend
const callHistory = [
  {
    id: "1",
    name: "Yatin Manuel",
    type: "outgoing",
    duration: "12:34",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: "2",
    name: "Sarah Johnson",
    type: "incoming",
    duration: "5:21",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
  {
    id: "3",
    name: "Michael Chen",
    type: "outgoing",
    duration: "8:45",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: "4",
    name: "Emma Wilson",
    type: "incoming",
    duration: "3:12",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
]

// Sample unread messages data
const unreadMessages = [
  {
    id: "1",
    sender: "Alex Thompson",
    subject: "Project Update",
    preview: "I've completed the initial design for the new dashboard...",
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    isImportant: true,
  },
  {
    id: "2",
    sender: "Jamie Rodriguez",
    subject: "Meeting Rescheduled",
    preview: "Our team meeting has been moved to Thursday at 2pm...",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    isImportant: false,
  },
  {
    id: "3",
    sender: "Taylor Kim",
    subject: "New Feature Request",
    preview: "The client is asking if we can add voice recognition to...",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isImportant: true,
  },
  {
    id: "4",
    sender: "Morgan Lee",
    subject: "Feedback on Presentation",
    preview: "Great job on yesterday's presentation! I have a few suggestions...",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
]

export default function DashboardPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([])

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // Load upcoming meetings
        const meetings = await getUpcomingMeetings(user.uid, 7) // Get meetings for next 7 days
        setUpcomingMeetings(meetings)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  // Format time for upcoming meetings
  const formatMeetingTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Format date for upcoming meetings
  const formatMeetingDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
    }
  }

  // Handle quick action clicks
  const handleQuickAction = async (actionType: string) => {
    let promptText = ""

    switch (actionType) {
      case "call":
        promptText = "Make a call to "
        break
      case "email":
        promptText = "Send an email to "
        break
      case "meeting":
        promptText = "Schedule a meeting with "
        break
      default:
        promptText = ""
    }

    // Create a new chat and navigate to it with the prompt text
    try {
      const chatId = await createNewChat(user?.uid || "")
      // Store the prompt text to be used in the assistant page
      localStorage.setItem("assistantPrompt", promptText)
      router.push(`/assistant?chat=${chatId}`)
    } catch (error) {
      console.error("Error creating new chat:", error)
    }
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  // Format call time
  const formatCallTime = (timestamp: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (timestamp.toDateString() === today.toDateString()) {
      return `Today, ${timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else if (timestamp.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else {
      return timestamp.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  // Format message time
  const formatMessageTime = (timestamp: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (timestamp.toDateString() === today.toDateString()) {
      return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (timestamp.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return timestamp.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  // Handle call back
  const handleCallBack = async (name: string, option: string) => {
    if (option === "assistant") {
      try {
        const chatId = await createNewChat(user?.uid || "")
        localStorage.setItem("assistantPrompt", `Call ${name}`)
        router.push(`/assistant?chat=${chatId}`)
      } catch (error) {
        console.error("Error creating new chat:", error)
      }
    } else {
      // In a real app, this would initiate a direct call
      alert(`Initiating direct call to ${name}`)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="absolute inset-0 -z-1">
          <TimeBasedArt />
        </div>
        <div className="flex flex-1 flex-col gap-6 p-6 pt-[12rem] relative z-10">
          {/* Greeting Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="h-8 w-8 text-orange-400" />
              <h1 className="text-4xl font-semibold text-black dark:text-white">
                {getGreeting()}, {userData?.firstName || "there"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push("/assistant")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Assistant
              </Button>
            </div>
          </div>

          {/* Unread Messages Section */}
          <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Unread Messages</CardTitle>
                <CardDescription>Your latest unread emails and messages</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                View All Messages
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted"></div>
                        <div className="h-3 w-1/2 animate-pulse rounded-md bg-muted"></div>
                      </div>
                      <div className="h-10 w-24 animate-pulse rounded-md bg-muted"></div>
                    </div>
                  ))}
                </div>
              ) : unreadMessages.length > 0 ? (
                <ScrollArea className="h-[220px] pr-4">
                  <div className="space-y-3">
                    {unreadMessages.map((message) => (
                      <a
                        key={message.id}
                        href="#" // In a real app, this would link to the message
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group cursor-pointer block"
                        onClick={(e) => {
                          e.preventDefault()
                          // In a real app, this would open the message
                          window.open("#", "_blank")
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(message.sender)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{message.sender}</h4>
                              {message.isImportant && (
                                <span className="rounded-full bg-red-500 p-1">
                                  <Bell className="h-3 w-3 text-white" />
                                </span>
                              )}
                            </div>
                            <div className="font-medium text-sm">{message.subject}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{message.preview}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">{formatMessageTime(message.timestamp)}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No unread messages</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upcoming Events Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Your schedule for the next few days</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Calendar
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted"></div>
                          <div className="h-3 w-1/2 animate-pulse rounded-md bg-muted"></div>
                        </div>
                        <div className="h-10 w-24 animate-pulse rounded-md bg-muted"></div>
                      </div>
                    ))}
                  </div>
                ) : upcomingMeetings.length > 0 ? (
                  <ScrollArea className="h-[280px] pr-4">
                    <div className="space-y-3">
                      {upcomingMeetings.map((meeting, index) => (
                        <a
                          key={meeting.id}
                          href="#" // In a real app, this would be the calendar link
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group cursor-pointer block"
                          onClick={(e) => {
                            e.preventDefault()
                            // In a real app, this would open the calendar event
                            window.open("#", "_blank")
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(meeting.attendees[0].split("@")[0])}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{meeting.title}</h4>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <User className="h-3 w-3 mr-1" />
                                <span>{meeting.attendees[0].split("@")[0].replace(".", " ")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatMeetingDate(meeting.startTime)}</div>
                            <div className="text-sm text-muted-foreground">{formatMeetingTime(meeting.startTime)}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No upcoming events scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get things done faster</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex-col justify-center"
                    onClick={() => handleQuickAction("call")}
                  >
                    <Phone className="mb-2 h-5 w-5" />
                    Make a Call
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col justify-center"
                    onClick={() => handleQuickAction("email")}
                  >
                    <Mail className="mb-2 h-5 w-5" />
                    Send an Email
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col justify-center col-span-2"
                    onClick={() => handleQuickAction("meeting")}
                  >
                    <Calendar className="mb-2 h-5 w-5" />
                    Schedule Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Call History Section - Full Width */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Calls</CardTitle>
                  <CardDescription>Your incoming and outgoing calls</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/calls")}>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  View All Calls
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[220px] pr-4">
                  <div className="space-y-3">
                    {callHistory.map((call) => (
                      <div
                        key={call.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/calls/${call.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            {call.type === "incoming" ? (
                              <PhoneIncoming className="h-4 w-4 text-green-500" />
                            ) : (
                              <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{call.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {call.type === "incoming" ? "Incoming" : "Outgoing"} • {call.duration}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">{formatCallTime(call.timestamp)}</div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <Phone className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCallBack(call.name, "assistant")
                                }}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Call via Assistant
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCallBack(call.name, "personal")
                                }}
                              >
                                <Phone className="mr-2 h-4 w-4" />
                                Call via Personal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

