"use client"

import { useEffect, useRef, useState } from "react"
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

// Suggested prompts for the assistant
const suggestedPrompts = [
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
]

// Sample initial messages
const initialMessages = [
  {
    role: "assistant",
    content: "Hello! I'm your Starlis AI assistant. How can I help you today?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response after a short delay
    setTimeout(() => {
      const assistantMessage = {
        role: "assistant",
        content: getAssistantResponse(content),
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  // Simple response generation (in a real app, this would call an LLM API)
  const getAssistantResponse = (userMessage: string) => {
    if (userMessage.toLowerCase().includes("meeting")) {
      return "I've scheduled a meeting based on your request. Would you like me to send calendar invites to the participants?"
    } else if (userMessage.toLowerCase().includes("call")) {
      return "I can help you make that call. Would you like me to dial now or schedule it for later?"
    } else if (userMessage.toLowerCase().includes("reminder")) {
      return "I've set a reminder for you. I'll make sure to notify you at the appropriate time."
    } else if (userMessage.toLowerCase().includes("email")) {
      return "I've drafted an email based on your instructions. Would you like to review it before I send it?"
    } else {
      return "I understand your request. Is there anything specific you'd like me to help with regarding this task?"
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
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">View History</span>
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

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Starlis AI" />
                          <AvatarFallback>U</AvatarFallback>
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
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-2 px-3 text-sm"
                    onClick={() => handleSendMessage(prompt.text)}
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

