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
import { Calendar, Clock, MessageSquare, Phone, Send, Settings } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { saveChatMessage, getChatMessages, createNewChat } from "@/lib/firebase"
import { getGravatarUrl } from "@/lib/utils"
import { processAIMessage, executeAIAction } from "@/lib/ai-placeholder"

// Initial welcome message
const initialMessages = [
  {
    role: "assistant",
    content: "Hello! I'm your Starlis assistant. How can I help you today?",
    timestamp: new Date().toISOString(),
  },
]

// Quick action suggestions
const quickActions = [
  {
    text: "Call John about the project",
    icon: Phone,
  },
  {
    text: "Schedule a meeting for tomorrow",
    icon: Calendar,
  },
  {
    text: "Send a message to the team",
    icon: MessageSquare,
  },
  {
    text: "Set a reminder for 3pm",
    icon: Clock,
  },
]

export default function AssistantPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const searchParams = useSearchParams()
  const chatId = searchParams.get("chat")

  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [suggestedActions, setSuggestedActions] = useState<
    {
      title: string
      action: string
    }[]
  >([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
          setActiveChatId(chatId)
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
        setActiveChatId(newChatId)

        // Save the initial assistant message
        await saveChatMessage(user.uid, initialMessages[0])
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

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return

    // Add user message
    const userMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setSuggestedActions([]) // Clear any suggested actions

    try {
      // Save user message to Firestore
      await saveChatMessage(user.uid, userMessage)

      // Process the message with AI
      const aiResponse = await processAIMessage(
        user.uid,
        content,
        messages, // Pass chat history for context
      )

      setMessages((prev) => [...prev, aiResponse.message])

      // Set suggested actions if any
      if (aiResponse.suggestedActions) {
        setSuggestedActions(aiResponse.suggestedActions)
      }

      // Save assistant message to Firestore
      await saveChatMessage(user.uid, aiResponse.message)
    } catch (error) {
      console.error("Error processing message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle executing an AI action
  const handleExecuteAction = async (action: string) => {
    if (!user) return

    setIsLoading(true)

    try {
      const result = await executeAIAction(user.uid, action)

      // Add a system message about the action
      const systemMessage = {
        role: "assistant",
        content: result.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, systemMessage])

      // Save the system message
      await saveChatMessage(user.uid, systemMessage)

      // Clear suggested actions after executing one
      setSuggestedActions([])
    } catch (error) {
      console.error("Error executing action:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Format timestamp to readable time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Navigate to assistant settings
  const goToAssistantSettings = () => {
    router.push("/settings?tab=assistant")
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
                  <BreadcrumbPage>Starlis Assistant</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToAssistantSettings}>
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Assistant Settings</span>
            </Button>
          </div>
        </header>

        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
          <div className="grid h-full grid-rows-[1fr,auto]">
            <Card className="flex flex-col overflow-hidden p-4 bg-background border-muted">
              <ScrollArea className="flex-1 pr-4">
                <div className="flex flex-col gap-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Starlis" />
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex flex-col gap-1 max-w-[80%]">
                        <div
                          className={cn(
                            "rounded-lg p-3",
                            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                      </div>

                      {message.role === "user" && userData && (
                        <Avatar className="h-8 w-8 mt-1">
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
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Starlis" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1 max-w-[80%]">
                        <div className="rounded-lg p-3 bg-muted">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                            <div
                              className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                            <div
                              className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                              style={{ animationDelay: "0.4s" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </Card>

            <div className="space-y-4">
              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-2 px-3 text-sm bg-background hover:bg-muted"
                    onClick={() => handleSendMessage(action.text)}
                    disabled={isLoading}
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.text}
                  </Button>
                ))}
              </div>

              {/* Suggested actions from AI response */}
              {suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="secondary"
                      className="h-auto py-2 px-3 text-sm"
                      onClick={() => handleExecuteAction(action.action)}
                      disabled={isLoading}
                    >
                      {action.title}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 relative">
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
                  className="flex-1 pl-4 pr-10 py-6 text-base rounded-full border-muted bg-background"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full w-10 h-10 p-0"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Customize your assistant's behavior in{" "}
                <button onClick={goToAssistantSettings} className="text-primary hover:underline focus:outline-none">
                  Assistant Settings
                </button>
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

