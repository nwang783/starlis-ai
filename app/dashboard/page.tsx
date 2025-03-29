"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "../../components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Mail, MessageSquare, Phone, Plus, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { getChatHistory, createNewChat } from "@/lib/firebase"
import { getGravatarUrl } from "@/lib/utils"
import {
  getUserDashboardStats,
  getUpcomingMeetings,
  getUserNotifications,
  getRecentEmails,
  type Meeting,
  type Notification,
  type Email,
} from "@/lib/placeholders"

export default function DashboardPage() {
  const { user, userData } = useAuth()
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<{
    tasksCompleted: number
    totalTasks: number
    timeSaved: number
    upcomingMeetings: number
    unreadEmails: number
    productivityIncrease: number
  } | null>(null)
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [recentEmails, setRecentEmails] = useState<Email[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // Load chat history from Firebase
        const history = await getChatHistory(user.uid)
        setChatHistory(history)

        // Load placeholder data
        const stats = await getUserDashboardStats(user.uid)
        setDashboardStats(stats)

        const meetings = await getUpcomingMeetings(user.uid, 1) // Get meetings for next 24 hours
        setUpcomingMeetings(meetings)

        const notifs = await getUserNotifications(user.uid, true) // Get unread notifications
        setNotifications(notifs)

        const emails = await getRecentEmails(user.uid, 3)
        setRecentEmails(emails)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const handleNewChat = async () => {
    if (!user) return

    try {
      const newChatId = await createNewChat(user.uid)
      window.location.href = `/assistant?chat=${newChatId}`
    } catch (error) {
      console.error("Error creating new chat:", error)
    }
  }

  // Format date for chat history
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date >= today) {
      return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else if (date >= yesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    }
  }

  // Format time for upcoming meetings
  const formatMeetingTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Task</span>
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Welcome to Starlis AI{userData ? `, ${userData.firstName}` : ""}</h1>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                <CardDescription>This week</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {dashboardStats?.tasksCompleted}/{dashboardStats?.totalTasks}
                    </div>
                    <Progress
                      value={dashboardStats ? (dashboardStats.tasksCompleted / dashboardStats.totalTasks) * 100 : 0}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      +{dashboardStats?.productivityIncrease || 0}% from last week
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <CardDescription>This month</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{dashboardStats?.timeSaved || 0} hours</div>
                    <Progress value={78} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      +{dashboardStats?.productivityIncrease || 0}% from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
                <CardDescription>Next 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
                    {upcomingMeetings.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Next:</span> {upcomingMeetings[0].title} at{" "}
                        {formatMeetingTime(upcomingMeetings[0].startTime)}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="md:col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted"></div>
                          <div className="h-3 w-1/2 animate-pulse rounded-md bg-muted"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Meeting activity */}
                    {upcomingMeetings.length > 0 && (
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Meeting scheduled: {upcomingMeetings[0].title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Today at {formatMeetingTime(upcomingMeetings[0].startTime)}
                          </p>
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={userData ? getGravatarUrl(userData.email) : "/placeholder.svg?height=32&width=32"}
                            alt="You"
                          />
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    {/* Email activity */}
                    {recentEmails.length > 0 && (
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">Email received: {recentEmails[0].subject}</p>
                          <p className="text-sm text-muted-foreground">From {recentEmails[0].sender}</p>
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={userData ? getGravatarUrl(userData.email) : "/placeholder.svg?height=32&width=32"}
                            alt="You"
                          />
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    {/* Call activity */}
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Call summary with John from Acme Inc.</p>
                        <p className="text-sm text-muted-foreground">3 hours ago</p>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="John D." />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Chat activity */}
                    {chatHistory.length > 0 && (
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">Chat conversation with Starlis Assistant</p>
                          <p className="text-sm text-muted-foreground">{formatDate(chatHistory[0].updatedAt)}</p>
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={userData ? getGravatarUrl(userData.email) : "/placeholder.svg?height=32&width=32"}
                            alt="You"
                          />
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-20 flex-col justify-center" onClick={handleNewChat}>
                    <MessageSquare className="mb-2 h-5 w-5" />
                    Chat with Assistant
                  </Button>
                  <Button variant="outline" className="h-20 flex-col justify-center">
                    <Calendar className="mb-2 h-5 w-5" />
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" className="h-20 flex-col justify-center">
                    <Mail className="mb-2 h-5 w-5" />
                    Compose Email
                  </Button>
                  <Button variant="outline" className="h-20 flex-col justify-center">
                    <Phone className="mb-2 h-5 w-5" />
                    Make a Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat History List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Recent Chat History</CardTitle>
                <CardDescription>Your previous conversations with Starlis Assistant</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleNewChat}>
                <MessageSquare className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : chatHistory.length > 0 ? (
                  chatHistory.map((chat, i) => (
                    <a
                      key={chat.id}
                      href={`/assistant?chat=${chat.id}`}
                      className="flex flex-col space-y-1 rounded-md border p-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{chat.title || "Untitled Chat"}</h4>
                        <span className="text-xs text-muted-foreground">{formatDate(chat.updatedAt)}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MessageSquare className="mr-1 h-3 w-3" />
                        {chat.messageCount || 0} messages
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    <p>No chat history yet. Start a new conversation!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productivity Insights</CardTitle>
              <CardDescription>Your AI assistant is learning your preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted"></div>
                          <div className="h-2 w-full animate-pulse rounded-md bg-muted"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Most productive time</p>
                          <p className="text-sm font-medium">9:00 AM - 11:00 AM</p>
                        </div>
                        <Progress value={85} className="mt-2" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Email response time</p>
                          <p className="text-sm font-medium">Improved by 35%</p>
                        </div>
                        <Progress value={65} className="mt-2" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

