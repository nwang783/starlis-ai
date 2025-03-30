"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppSidebar } from "../../components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { FileText, Paperclip, Send, Sun } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, extractPhoneNumber } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { saveChatMessage, getChatMessages, createNewChat } from "@/lib/firebase"
import { getGravatarUrl } from "@/lib/utils"
import { processAIMessage } from "@/lib/ai-service" // Updated import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Pencil } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { CallCard } from "@/components/call-card"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { query, orderBy } from "firebase/firestore"

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
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [selectedStyle, setSelectedStyle] = useState("balanced")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [recentConversations, setRecentConversations] = useState<any[]>([])
  const [isLocalOnly, setIsLocalOnly] = useState(false)
  const { toast } = useToast()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isAIServiceWorking, setIsAIServiceWorking] = useState(true)

  // Call service state
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null)
  const [activeCallNumber, setActiveCallNumber] = useState<string | null>(null)
  const [activeCallName, setActiveCallName] = useState<string | null>(null)
  const [showDemoCall, setShowDemoCall] = useState(false)

  // Check if OpenAI API is working
  useEffect(() => {
    const checkOpenAIService = async () => {
      try {
        const response = await fetch("/api/test-openai")
        const data = await response.json()

        if (data.status === "success") {
          setIsAIServiceWorking(true)
          console.log("OpenAI service is working")
        } else {
          setIsAIServiceWorking(false)
          console.warn("OpenAI service is not working:", data.message)

          // Show a toast notification
          toast({
            title: "Limited AI Functionality",
            description: "The AI service is currently in fallback mode. Some features may be limited.",
            duration: 5000,
          })
        }
      } catch (error) {
        console.error("Error checking OpenAI service:", error)
        setIsAIServiceWorking(false)
      }
    }

    checkOpenAIService()
  }, [toast])

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
        }
        setCurrentChatId(chatId)
      } catch (error) {
        console.error("Error loading chat messages:", error)
        toast({
          title: "Error loading chat",
          description: "Could not load chat messages. Using local mode instead.",
          variant: "destructive",
        })
        setIsLocalOnly(true)
      }
    }

    loadChatMessages()
  }, [user, chatId, toast])

  // Create a new chat if no chatId is provided
  useEffect(() => {
    const initializeChat = async () => {
      if (!user || chatId) return // Skip if user is not logged in or chatId exists

      setIsLoading(true)
      try {
        // Create a new chat
        const newChatId = await createNewChat(user.uid, "New Conversation")
        setCurrentChatId(newChatId)

        // Add welcome message
        const welcomeMessage = {
          role: "assistant",
          content: `Hello! I'm your AI assistant. How can I help you today?`,
          timestamp: new Date().toISOString(),
        }

        setMessages([welcomeMessage])

        try {
          await saveChatMessage(user.uid, newChatId, welcomeMessage)
        } catch (error) {
          console.error("Error saving welcome message:", error)
          // Continue in local-only mode
          setIsLocalOnly(true)
        }
      } catch (error) {
        console.error("Error initializing chat:", error)

        // Fallback to local-only mode
        setIsLocalOnly(true)
        const welcomeMessage = {
          role: "assistant",
          content: `Hello! I'm your AI assistant. How can I help you today?`,
          timestamp: new Date().toISOString(),
        }
        setMessages([welcomeMessage])

        toast({
          title: "Limited functionality mode",
          description: "Using local storage due to database access issues. Your data won't be saved to your account.",
          duration: 5000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeChat()
  }, [user, chatId, toast])

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load recent conversations
  useEffect(() => {
    const loadRecentConversations = async () => {
      if (!user) return

      try {
        // Get recent chats from Firestore
        const chatsRef = collection(db, "users", user.uid, "chats")
        const q = query(chatsRef, orderBy("updatedAt", "desc"))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const chats = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
          }))

          setRecentConversations(chats.slice(0, 5))
        } else {
          // Fallback to mock data if no chats found
          setRecentConversations([
            {
              id: "chat1",
              title: "New conversation",
              lastMessage: "Hello! I'm your AI assistant. How can I help you today?",
              timestamp: new Date().toISOString(),
            },
          ])
        }
      } catch (error) {
        console.error("Error loading recent conversations:", error)
        // Fallback to mock data
        setRecentConversations([
          {
            id: "chat1",
            title: "New conversation",
            lastMessage: "Hello! I'm your AI assistant. How can I help you today?",
            timestamp: new Date().toISOString(),
          },
        ])
      }
    }

    loadRecentConversations()
  }, [user])

  // Function to initiate a call
  const initiateCall = async (phoneNumber: string, contactName?: string) => {
    if (!user) return

    try {
      // Check if user has Twilio credentials
      if (!userData?.voice?.twilioSid && !userData?.onboarding?.voice?.twilioSid) {
        // Show demo call if no credentials
        setShowDemoCall(true)

        // Store demo call data in session storage
        const demoCallData = {
          callSid: "demo-call-" + Date.now(),
          phoneNumber: phoneNumber || "+1 (555) 123-4567",
          contactName: contactName || "John Doe",
          callStatus: "in-progress",
        }
        sessionStorage.setItem("activeCall", JSON.stringify(demoCallData))

        return
      }

      // Show demo call for now
      setShowDemoCall(true)

      // Store demo call data in session storage
      const demoCallData = {
        callSid: "demo-call-" + Date.now(),
        phoneNumber: phoneNumber || "+1 (555) 123-4567",
        contactName: contactName || "John Doe",
        callStatus: "in-progress",
      }
      sessionStorage.setItem("activeCall", JSON.stringify(demoCallData))

      // Show toast notification for active call
      toast({
        title: "Active Call",
        description: "Call in progress",
        duration: Number.POSITIVE_INFINITY,
      })

      return

      // Make API call to initiate real call
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          phoneNumber,
          name: contactName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to initiate call")
      }

      const data = await response.json()

      // Set active call information
      setActiveCallSid(data.callSid)
      setActiveCallNumber(phoneNumber)
      setActiveCallName(contactName || phoneNumber)
    } catch (error) {
      console.error("Error initiating call:", error)
      // Show error message to user
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I couldn't initiate the call. Please check your Twilio settings and try again.",
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }

  // Handle call ended
  const handleCallEnded = (transcript: string[]) => {
    // Clear active call
    setActiveCallSid(null)
    setActiveCallNumber(null)
    setActiveCallName(null)
    setShowDemoCall(false)

    // Clear session storage
    sessionStorage.removeItem("activeCall")

    // Add transcript to chat
    if (transcript && transcript.length > 0) {
      const transcriptText = transcript.join("\n")
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Call ended. Here's the transcript:\n\n${transcriptText}`,
          timestamp: new Date().toISOString(),
        },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Call ended.",
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return

    setIsChatExpanded(true)

    // Check if message is about making a call
    if (content.toLowerCase().includes("call") && !activeCallSid && !showDemoCall) {
      // Extract phone number using our utility function
      const phoneNumber = extractPhoneNumber(content)

      // Extract name using simple heuristic
      let name = null
      if (phoneNumber) {
        const beforePhone = content.substring(0, content.indexOf(phoneNumber)).toLowerCase()
        if (beforePhone.includes("call")) {
          const nameMatch = beforePhone.match(/call\s+([a-z]+)/i)
          if (nameMatch && nameMatch[1]) {
            name = nameMatch[1]
          }
        }
      }

      const userMessage = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")

      // Add assistant response about making the call
      const assistantResponse = {
        role: "assistant",
        content: `I'm calling ${name || (phoneNumber ? phoneNumber : "the number you requested")}...`,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantResponse])

      // Save messages to Firestore if not in local-only mode
      if (!isLocalOnly && currentChatId) {
        try {
          await saveChatMessage(user.uid, currentChatId, userMessage)
          await saveChatMessage(user.uid, currentChatId, assistantResponse)
        } catch (error) {
          console.error("Error saving messages:", error)
        }
      }

      // Initiate the call
      if (phoneNumber) {
        await initiateCall(phoneNumber, name)
      } else {
        // Demo call with fake number if no number found
        setShowDemoCall(true)
      }

      return
    }

    await handleSendMessageRegular(content)
  }

  // Regular message handling
  const handleSendMessageRegular = async (content: string) => {
    // Validate content
    if (!content || !content.trim()) {
      console.error("Empty content in handleSendMessageRegular")
      return
    }

    const userMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Save user message to Firestore if not in local-only mode
      if (!isLocalOnly && currentChatId && user) {
        try {
          await saveChatMessage(user.uid, currentChatId, userMessage)
        } catch (error) {
          console.error("Error saving user message:", error)
          // If saving fails, switch to local-only mode
          setIsLocalOnly(true)
          toast({
            title: "Switched to local mode",
            description: "Could not save message to database. Using local mode instead.",
            duration: 3000,
          })
        }
      }

      // Process the message with AI
      try {
        // Ensure user is defined
        if (!user) {
          throw new Error("User is not authenticated")
        }

        const aiResponse = await processAIMessage(user.uid, content, messages)

        if (aiResponse && aiResponse.message) {
          setMessages((prev) => [...prev, aiResponse.message])

          // Save AI response to Firestore if not in local-only mode
          if (!isLocalOnly && currentChatId) {
            try {
              await saveChatMessage(user.uid, currentChatId, aiResponse.message)
            } catch (error) {
              console.error("Error saving AI response:", error)
            }
          }
        } else {
          throw new Error("Invalid AI response format")
        }
      } catch (aiError) {
        console.error("Error processing AI message:", aiError)

        // Add error message to chat
        const errorMessage = {
          role: "assistant",
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, errorMessage])

        toast({
          title: "AI Service Error",
          description: "There was a problem connecting to the AI service. Please try again later.",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error in message handling:", error)

      // Add error message
      const errorMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, errorMessage])

      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessageWrapper = async (content: string) => {
    // Validate content
    if (!content || !content.trim()) {
      console.error("Empty content in handleSendMessageWrapper")
      return
    }

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the assistant.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    const contentLower = content.toLowerCase()
    if (contentLower.includes("call") && !activeCallSid && !showDemoCall) {
      await handleSendMessage(content)
    } else {
      await handleSendMessageRegular(content)
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-3xl">
              {!isChatExpanded ? (
                <div className="space-y-8">
                  <div className="flex items-center gap-2">
                    <Sun className="h-6 w-6 text-orange-400" />
                    <h1 className="text-3xl font-semibold">
                      {getGreeting()}, {userData?.firstName || "there"}
                    </h1>
                  </div>

                  <Card className="border-zinc-800 bg-sidebar/50 p-4">
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          placeholder="How can I help you today?"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              setIsChatExpanded(true)
                              handleSendMessageWrapper(input)
                            }
                          }}
                          className="border-zinc-700 bg-transparent py-6 text-base placeholder:text-zinc-400"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => {
                            setIsChatExpanded(true)
                            handleSendMessageWrapper(input)
                          }}
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
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
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
                          <span>Collaborate with your assistant using documents, images, and more</span>
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
                              onClick={() => handleSendMessageWrapper(action.text)}
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
                              <span className="text-xs">{formatRelativeTime(conversation.timestamp)}</span>
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
                    <div className="flex flex-col gap-6">
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
                              "max-w-[80%] rounded-2xl p-4",
                              message.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800/80 text-zinc-100",
                            )}
                          >
                            {/* Special card for email draft */}
                            {message.role === "assistant" && message.content.includes("I've drafted an email") && (
                              <div className="mb-3 rounded-xl border border-zinc-700 bg-zinc-900 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm font-medium text-blue-400">Email Draft</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 w-7 rounded-full p-0">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 rounded-full p-0">
                                      <Send className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex gap-2">
                                    <span className="font-medium text-zinc-400">To:</span>
                                    <span>client@example.com</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="font-medium text-zinc-400">Subject:</span>
                                    <span>Project Update: Q2 Progress Report</span>
                                  </div>
                                </div>
                                <Separator className="my-2 bg-zinc-700" />
                                <div className="text-sm">
                                  <p>Dear Client,</p>
                                  <p className="mt-2">
                                    I hope this email finds you well. I wanted to provide you with an update on our
                                    project progress for Q2.
                                  </p>
                                  <p className="mt-2">
                                    We've successfully completed the first phase of development and are on track to meet
                                    our next milestone by the end of the month.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Show active call card */}
                            {message.role === "assistant" &&
                              message.content.includes("I'm calling") &&
                              (activeCallSid || showDemoCall) && (
                                <div className="mb-3">
                                  {activeCallSid ? (
                                    <CallCard
                                      callSid={activeCallSid}
                                      phoneNumber={activeCallNumber || ""}
                                      contactName={activeCallName || undefined}
                                      onCallEnded={handleCallEnded}
                                    />
                                  ) : (
                                    <CallCard
                                      callSid="demo-call"
                                      phoneNumber="+1 (555) 123-4567"
                                      contactName="John Doe"
                                      onCallEnded={handleCallEnded}
                                      isDemo={true}
                                    />
                                  )}
                                </div>
                              )}

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

                      {/* Demo messages to showcase the special cards */}
                      {messages.length === 0 && isChatExpanded && (
                        <>
                          <div className="flex gap-3 justify-start">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI Assistant" />
                              <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                            <div className="max-w-[80%] rounded-2xl bg-zinc-800/80 p-4 text-zinc-100">
                              <p className="text-sm">Hello! I'm your AI assistant. How can I help you today?</p>
                            </div>
                          </div>
                        </>
                      )}

                      {isLoading && (
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI Assistant" />
                            <AvatarFallback>AI</AvatarFallback>
                          </Avatar>
                          <div className="rounded-2xl bg-zinc-800/80 p-4">
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
                        placeholder="Message your assistant..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessageWrapper(input)
                          }
                        }}
                        className="border-zinc-700 bg-transparent py-6 text-base text-zinc-100 placeholder:text-zinc-400"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => handleSendMessageWrapper(input)}
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

