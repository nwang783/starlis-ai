"use client"

import { useState } from "react"
import { AppSidebar } from "../../components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Search, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"

// First, let's update the mock data to include phone numbers and make some contacts without names
// Add this near the top of the file where mockCalls is defined

// Update the mockCalls array to include phone numbers and some entries without names
const mockCalls = [
  {
    id: "call-1",
    contactName: "John Smith",
    contactEmail: "john.smith@example.com",
    contactPhone: "+1 (555) 123-4567",
    contactAvatar: "", // Empty for placeholder
    type: "incoming",
    status: "completed",
    duration: "12:34",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    transcription:
      "Hi there, I wanted to discuss the project timeline. We need to move the deadline up by a week. Can you accommodate that? Let me know what you think.",
    notes: "Discussed project timeline changes",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "call-2",
    contactName: "Sarah Johnson",
    contactEmail: "sarah.j@example.com",
    contactPhone: "+1 (555) 987-6543",
    contactAvatar: "", // Empty for placeholder
    type: "outgoing",
    status: "completed",
    duration: "08:12",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    transcription:
      "Hello Sarah, I'm calling about the marketing materials we discussed. I've reviewed the drafts and have some feedback. The color scheme works well, but I think we should adjust the messaging to be more direct.",
    notes: "Provided feedback on marketing materials",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "call-3",
    contactName: "", // No name
    contactEmail: "",
    contactPhone: "+1 (555) 234-5678",
    contactAvatar: "", // Empty for placeholder
    type: "incoming",
    status: "missed",
    duration: "00:00",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    transcription: "",
    notes: "Attempted to discuss quarterly review",
    audioUrl: "",
  },
  {
    id: "call-4",
    contactName: "Emma Wilson",
    contactEmail: "emma.w@example.com",
    contactPhone: "+1 (555) 345-6789",
    contactAvatar: "", // Empty for placeholder
    type: "outgoing",
    status: "completed",
    duration: "15:47",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    transcription:
      "Hi Emma, I'm following up on our previous conversation about the client presentation. I've incorporated your suggestions and wanted to walk through the changes. The main points we'll cover are market analysis, competitive positioning, and our proposed solution.",
    notes: "Reviewed presentation changes",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "call-5",
    contactName: "", // No name
    contactEmail: "",
    contactPhone: "+1 (555) 456-7890",
    contactAvatar: "", // Empty for placeholder
    type: "incoming",
    status: "completed",
    duration: "05:23",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    transcription:
      "Hey, just wanted to check in about the upcoming team meeting. I have a conflict with the scheduled time. Would it be possible to move it back by an hour? That would work much better for my schedule.",
    notes: "Discussed rescheduling team meeting",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
]

// Quick prompt suggestions
const quickPrompts = [
  "Schedule a follow-up call",
  "Send meeting notes",
  "Create a task from this call",
  "Share call recording",
]

export default function CallsPage() {
  const { userData } = useAuth()
  const [expandedCall, setExpandedCall] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({})
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({})
  const audioRefs: Record<string, HTMLAudioElement | null> = {}

  // Filter calls based on type and search query
  const filteredCalls = mockCalls.filter((call) => {
    const matchesFilter = filter === "all" || call.type === filter
    const matchesSearch =
      call.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.notes.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Format date for display
  const formatDate = (date: Date) => {
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

  // Handle audio playback
  const togglePlayback = (callId: string, audioUrl: string) => {
    if (!audioRefs[callId]) {
      audioRefs[callId] = new Audio(audioUrl)

      audioRefs[callId]?.addEventListener("timeupdate", () => {
        if (audioRefs[callId]) {
          const progress = (audioRefs[callId]!.currentTime / audioRefs[callId]!.duration) * 100
          setAudioProgress((prev) => ({ ...prev, [callId]: progress }))
        }
      })

      audioRefs[callId]?.addEventListener("ended", () => {
        setIsPlaying((prev) => ({ ...prev, [callId]: false }))
      })
    }

    if (isPlaying[callId]) {
      audioRefs[callId]?.pause()
    } else {
      // Pause all other audio
      Object.keys(isPlaying).forEach((id) => {
        if (id !== callId && isPlaying[id]) {
          audioRefs[id]?.pause()
          setIsPlaying((prev) => ({ ...prev, [id]: false }))
        }
      })

      audioRefs[callId]?.play()
    }

    setIsPlaying((prev) => ({ ...prev, [callId]: !prev[callId] }))
  }

  // Handle call expansion
  const toggleCallExpansion = (callId: string) => {
    window.location.href = `/calls/${callId}`
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
                  <BreadcrumbPage>Calls</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm">
              <PhoneCall className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Call</span>
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Call History</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Date Range</span>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Calls</SelectItem>
                <SelectItem value="incoming">Incoming Calls</SelectItem>
                <SelectItem value="outgoing">Outgoing Calls</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Now let's update the Tabs section to reorder the tabs */}
          {/* Replace the Tabs component and its children with: */}
          <Tabs defaultValue="recent">
            <TabsList>
              <TabsTrigger value="recent">Recent Calls</TabsTrigger>
              <TabsTrigger value="missed">Missed Calls</TabsTrigger>
              <TabsTrigger value="all">All Calls</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-4">
              <Card className="overflow-hidden border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCalls.filter((call) => {
                        const now = new Date()
                        const yesterday = new Date(now)
                        yesterday.setDate(yesterday.getDate() - 1)
                        return call.date >= yesterday
                      }).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No recent calls found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCalls
                          .filter((call) => {
                            const now = new Date()
                            const yesterday = new Date(now)
                            yesterday.setDate(yesterday.getDate() - 1)
                            return call.date >= yesterday
                          })
                          .map((call) => (
                            <TableRow
                              key={call.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleCallExpansion(call.id)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 flex-shrink-0">
                                    {call.contactAvatar ? (
                                      <AvatarImage
                                        src={call.contactAvatar}
                                        alt={call.contactName || call.contactPhone}
                                      />
                                    ) : (
                                      <AvatarFallback className="bg-muted">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{call.contactName || call.contactPhone}</div>
                                    <div className="text-xs text-muted-foreground">{call.contactPhone}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {call.type === "incoming" ? (
                                    <>
                                      <PhoneIncoming className="h-4 w-4 text-green-500" />
                                      <span>Incoming</span>
                                    </>
                                  ) : (
                                    <>
                                      <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                                      <span>Outgoing</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{call.duration}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{formatDate(call.date)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {call.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={call.status === "completed" ? "default" : "destructive"}
                                  className="capitalize"
                                >
                                  {call.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.location.href = `/calls/${call.id}`
                                  }}
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="missed" className="mt-4">
              <Card className="overflow-hidden border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCalls.filter((call) => call.status === "missed").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No missed calls found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCalls
                          .filter((call) => call.status === "missed")
                          .map((call) => (
                            <TableRow
                              key={call.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleCallExpansion(call.id)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 flex-shrink-0">
                                    {call.contactAvatar ? (
                                      <AvatarImage
                                        src={call.contactAvatar}
                                        alt={call.contactName || call.contactPhone}
                                      />
                                    ) : (
                                      <AvatarFallback className="bg-muted">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{call.contactName || call.contactPhone}</div>
                                    <div className="text-xs text-muted-foreground">{call.contactPhone}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {call.type === "incoming" ? (
                                    <>
                                      <PhoneIncoming className="h-4 w-4 text-green-500" />
                                      <span>Incoming</span>
                                    </>
                                  ) : (
                                    <>
                                      <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                                      <span>Outgoing</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{call.duration}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{formatDate(call.date)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {call.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="destructive" className="capitalize">
                                  {call.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.location.href = `/calls/${call.id}`
                                  }}
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <Card className="overflow-hidden border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCalls.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No calls found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCalls.map((call) => (
                          <TableRow
                            key={call.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleCallExpansion(call.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 flex-shrink-0">
                                  {call.contactAvatar ? (
                                    <AvatarImage src={call.contactAvatar} alt={call.contactName || call.contactPhone} />
                                  ) : (
                                    <AvatarFallback className="bg-muted">
                                      <User className="h-5 w-5 text-muted-foreground" />
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <div className="font-medium">{call.contactName || call.contactPhone}</div>
                                  <div className="text-xs text-muted-foreground">{call.contactPhone}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {call.type === "incoming" ? (
                                  <>
                                    <PhoneIncoming className="h-4 w-4 text-green-500" />
                                    <span>Incoming</span>
                                  </>
                                ) : (
                                  <>
                                    <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                                    <span>Outgoing</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{call.duration}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{formatDate(call.date)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {call.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={call.status === "completed" ? "default" : "destructive"}
                                className="capitalize"
                              >
                                {call.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.location.href = `/calls/${call.id}`
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

