"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "../../components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Phone, Plus, Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { saveChatMessage, getChatMessages, createNewChat } from "@/lib/firebase"
import { getGravatarUrl } from "@/lib/utils"
import { processAIMessage, executeAIAction, generateAISuggestions } from "@/lib/ai-placeholder"

// Initial welcome message
const initialMessages = [
  {
    role: "assistant",
    content: "Hello! I'm your Starlis AI assistant. How can I help you today?",
    timestamp: new Date().toISOString(),
  },
]

export default function AssistantPage() {
  const { user, userData } = useAuth()
  const searchParams = useSearchParams()
  const chatId = searchParams.get("chat")

  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [suggestedPrompts, setSuggestedPrompts] = useState<
    {
      text: string
      icon: any
    }[]
  >([
    {
      text: "Schedule a meeting with the marketing team for tomorrow at 2pm",
      icon: Calendar,
    },
    {
      text: "Make a phone call to John regarding the project update",
      icon: Phone,
    },
    {
      text: "Set a reminder for my doctor's appointment next Monday",
      icon: Clock,
    },
    {
      text: "Draft an email to the client about the project delay",
      icon: Plus,
    },
  ])
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

  // Generate dynamic suggestions based on chat context
  useEffect(() => {
    const generateSuggestions = async () => {
      if (!user || messages.length === 0) return

      try {
        // Get the last few messages for context
        const recentMessages = messages
          .slice(-3)
          .map((msg) => msg.content)
          .join(" ")

        // Generate suggestions based on context
        const suggestions = await generateAISuggestions(user.uid, recentMessages)

        // Map suggestions to UI format
        const icons = [Calendar, Phone, Clock, Plus]
        setSuggestedPrompts(
          suggestions.map((text, index) => ({
            text,
            icon: icons[index % icons.length],
          })),
        )
      } catch (error) {
        console.error("Error generating suggestions:", error)
      }
    }

    // Only generate new suggestions if we have more than the initial message
    if (messages.length > 1) {
      generateSuggestions()
    }
  }, [user, messages])

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
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard">
                <Clock className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">View History</span>
              </a>
            </Button>
          </div>
        </header>

        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
          <div className="grid h-full grid-rows-[1fr,auto]">
            <Card className="flex flex-col overflow-hidden p-4">
              <ScrollArea className="flex-1 pr-4">
                <div className="flex flex-col gap-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Starlis AI" />
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
                            {userData.firstName[0]}
                            {userData.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Starlis AI" />
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
              {/* Suggested actions from AI response */}
              {suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
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

              {/* Suggested prompts */}
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-2 px-3 text-sm"
                    onClick={() => handleSendMessage(prompt.text)}
                    disabled={isLoading}
                  >
                    <prompt.icon className="mr-2 h-4 w-4" />
                    {prompt.text}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(input)
                    }
                  }}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button onClick={() => handleSendMessage(input)} disabled={!input.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

