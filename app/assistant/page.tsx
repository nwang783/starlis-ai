"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppSidebar } from "../../components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { FileText, Paperclip, Send, Settings, Sun } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { saveChatMessage, getChatMessages, createNewChat } from "@/lib/firebase"
import { getGravatarUrl } from "@/lib/utils"
import { processAIMessage } from "@/lib/ai-placeholder"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Quick action suggestions
const quickActions = [
  {
    text: "Schedule a meeting",
    icon: FileText,
  },
  {
    text: "Send an email",
    icon: FileText,
  },
  {
    text: "Make a phone call",
    icon: FileText,
  },
]

export default function AssistantPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const searchParams = useSearchParams()
  const chatId = searchParams.get("chat")

  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [selectedModel, setSelectedModel] = useState("claude-3-sonnet")
  const [selectedStyle, setSelectedStyle] = useState("balanced")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [recentConversations, setRecentConversations] = useState<any[]>([])

  // Load chat messages if chatId is provided
  useEffect(() => {
    const loadChatMessages = async () => {
      if (!user || !chatId) return

      try {
        const chatMessages = await getChatMessages(user.uid, chatId)
        if (chatMessages.length > 0) {
          setMessages(
            chatMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
            })),
          )
          // setActiveChatId(chatId) // This line was removed because setActiveChatId is not used
        }
      } catch (error) {
        console.error("Error loading chat messages:", error)
      }
    }

    loadChatMessages()
  }, [user, chatId])

  // Create a new chat if no chatId is provided
  useEffect(() => {
    const initializeChat = async () => {
      if (!user || chatId) return

      try {
        const newChatId = await createNewChat(user.uid)
        // setActiveChatId(newChatId) // This line was removed because setActiveChatId is not used

        // Save the initial assistant message
        // await saveChatMessage(user.uid, initialMessages[0]) // This line was removed because initialMessages is not used
      } catch (error) {
        console.error("Error initializing chat:", error)
      }
    }

    initializeChat()
  }, [user, chatId])

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load recent conversations
  useEffect(() => {
    const loadRecentConversations = async () => {
      if (!user) return

      try {
        // In a real implementation, this would fetch from Firebase
        // For now, we'll use mock data
        setRecentConversations([
          {
            id: "chat1",
            title: "Project planning discussion",
            lastMessage: "Let me help you organize that project timeline.",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: "chat2",
            title: "Marketing strategy",
            lastMessage: "Here are some ideas for your social media campaign.",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
          {
            id: "chat3",
            title: "Website redesign",
            lastMessage: "I've analyzed your current website and have some suggestions.",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
        ])
      } catch (error) {
        console.error("Error loading recent conversations:", error)
      }
    }

    loadRecentConversations()
  }, [user])

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return

    setIsChatExpanded(true)
    // Rest of the message handling logic...
    const userMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Process the message with AI
      const aiResponse = await processAIMessage(user.uid, content, messages)

      setMessages((prev) => [...prev, aiResponse.message])
      await saveChatMessage(user.uid, aiResponse.message)
    } catch (error) {
      console.error("Error processing message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Format timestamp to readable time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  // Navigate to a specific conversation
  const navigateToConversation = (conversationId: string) => {
    router.push(`/assistant?chat=${conversationId}`)
  }

  // Navigate to assistant settings
  const goToAssistantSettings = () => {
    router.push("/settings?tab=assistant")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Assistant</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/settings?tab=assistant")}>
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Assistant Settings</span>
            </Button>
          </header>

          <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-3xl">
              {!isChatExpanded ? (
                <div className="space-y-8">
                  <div className="flex items-center gap-2">
                    <Sun className="h-6 w-6 text-orange-400" />
                    <h1 className="text-3xl font-semibold">
                      {getGreeting()}, {userData?.firstName}
                    </h1>
                  </div>

                  <Card className="border-zinc-800 bg-sidebar/50 p-4">
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          placeholder="How can Starlis help you today?"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage(input)
                            }
                          }}
                          className="border-zinc-700 bg-transparent py-6 text-base placeholder:text-zinc-400"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => handleSendMessage(input)}
                          disabled={!input.trim() || isLoading}
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="w-[200px] border-zinc-700 bg-transparent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="claude-3-sonnet">Claude 3.7 Sonnet</SelectItem>
                            <SelectItem value="claude-3-opus">Claude 3.7 Opus</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                          <SelectTrigger className="w-[150px] border-zinc-700 bg-transparent">
                            <SelectValue placeholder="Choose style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="balanced">Balanced</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="precise">Precise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span>Collaborate with Starlis using documents, images, and more</span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {quickActions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              className="border-zinc-700 bg-transparent hover:bg-zinc-800"
                              onClick={() => handleSendMessage(action.text)}
                            >
                              <action.icon className="mr-2 h-4 w-4" />
                              {action.text}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Recent conversations */}
                  <div className="mt-8">
                    <h2 className="mb-4 text-xl font-medium">Recent conversations</h2>
                    <div className="space-y-3">
                      {recentConversations.length > 0 ? (
                        recentConversations.map((conversation) => (
                          <Card
                            key={conversation.id}
                            className="cursor-pointer border-zinc-800 p-3 transition-colors hover:bg-zinc-800/50"
                            onClick={() => navigateToConversation(conversation.id)}
                          >
                            <div className="flex justify-between">
                              <h3 className="font-medium ">{conversation.title}</h3>
                              <span className="text-xs">
                                {formatRelativeTime(conversation.timestamp)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm line-clamp-1">{conversation.lastMessage}</p>
                          </Card>
                        ))
                      ) : (
                        <p className="text-center">No recent conversations</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="border-zinc-800">
                  <ScrollArea className="h-[calc(100vh-12rem)] p-4">
                    <div className="flex flex-col gap-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                        >
                          {message.role === "assistant" && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI Assistant" />
                              <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={cn(
                              "rounded-lg p-3",
                              message.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-100",
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>

                          {message.role === "user" && userData && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getGravatarUrl(userData.email)} alt={userData.firstName} />
                              <AvatarFallback>
                                {userData.firstName?.[0]}
                                {userData.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI Assistant" />
                            <AvatarFallback>AI</AvatarFallback>
                          </Avatar>
                          <div className="rounded-lg bg-zinc-800 p-3">
                            <div className="flex gap-1">
                              <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
                                style={{ animationDelay: "0.2s" }}
                              />
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
                                style={{ animationDelay: "0.4s" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="border-t border-zinc-800 p-4">
                    <div className="relative">
                      <Input
                        placeholder="Message Starlis..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage(input)
                          }
                        }}
                        className="border-zinc-700 bg-transparent py-6 text-base text-zinc-100 placeholder:text-zinc-400"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => handleSendMessage(input)}
                        disabled={!input.trim() || isLoading}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

