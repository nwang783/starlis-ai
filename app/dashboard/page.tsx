import { AppSidebar } from "../../components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Calendar, Clock, Mail, MessageSquare, Phone, Plus, Sparkles, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Page() {
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
            <Button variant="outline" size="sm">
              <Bell className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </Button>
            <Button size="sm">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Upgrade to Pro</span>
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Welcome to Starlis AI</h1>
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
                <div className="text-2xl font-bold">24/36</div>
                <Progress value={67} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">+8% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <CardDescription>This month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.5 hours</div>
                <Progress value={78} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">+15% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
                <CardDescription>Next 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Next:</span> Team Standup at 2:00 PM
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="md:col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      icon: Calendar,
                      title: "Meeting scheduled with Marketing team",
                      time: "10 minutes ago",
                      avatar: "/placeholder.svg?height=32&width=32",
                      name: "Sarah K.",
                    },
                    {
                      icon: Mail,
                      title: "Email drafted to client about project update",
                      time: "1 hour ago",
                      avatar: "/placeholder.svg?height=32&width=32",
                      name: "You",
                    },
                    {
                      icon: Phone,
                      title: "Call summary with John from Acme Inc.",
                      time: "3 hours ago",
                      avatar: "/placeholder.svg?height=32&width=32",
                      name: "John D.",
                    },
                    {
                      icon: MessageSquare,
                      title: "Chat conversation with Starlis Assistant",
                      time: "Yesterday",
                      avatar: "/placeholder.svg?height=32&width=32",
                      name: "You",
                    },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.avatar} alt={activity.name} />
                        <AvatarFallback>{activity.name[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-20 flex-col justify-center">
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

          <Card>
            <CardHeader>
              <CardTitle>Productivity Insights</CardTitle>
              <CardDescription>Your AI assistant is learning your preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

