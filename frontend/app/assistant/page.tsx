"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppSidebar } from "../../components/app-sidebar"
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send, Sun, Calendar, Mail, Phone, Copy, Volume2, RefreshCw, Square, Globe, Plus, LightbulbIcon, ArrowUp } from "lucide-react"
import { cn, extractPhoneNumber } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { saveChatMessage, getChatMessages, createNewChat } from "@/lib/firebase"
import { getGravatarUrl } from "@/lib/utils"
import { processAIMessage } from "@/lib/ai-service" // Updated import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { CallCard } from "@/components/call-card"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { query, orderBy } from "firebase/firestore"
import { TimeBasedArt } from "@/components/time-based-art"
import { NoiseTexture } from "@/components/noise-texture"
import { TypewriterText } from "@/components/typewriter-text"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { ChatHeader } from "@/components/chat-header"
import { MessageContainer } from '@/components/messages/message-container'
import {
  createConversation,
  getConversation,
  addMessage,
  updateMessage,
  deleteMessage,
  updateConversationName,
  deleteConversation,
  getConversationMessages,
  getUserConversations
} from '@/lib/firebase/conversations'
import { Message, Conversation } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'

// Quick action suggestions
const quickActions = [
  {
    text: "Schedule a meeting",
    icon: Calendar,
    color: "text-red-500",
  },
  {
    text: "Send an email",
    icon: Mail,
    color: "text-blue-500",
  },
  {
    text: "Make a phone call",
    icon: Phone,
    color: "text-green-500",
  },
]

export default function AssistantPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const searchParams = useSearchParams()
  const chatId = searchParams.get("chat")
  const [isMobileMode, setIsMobileMode] = useState(false)

  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [selectedModel, setSelectedModel] = useState("claude-3-7-sonnet-latest")
  const [selectedStyle, setSelectedStyle] = useState("balanced")
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false)
  const [isReasonEnabled, setIsReasonEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [recentConversations, setRecentConversations] = useState<any[]>([])
  const [isLocalOnly, setIsLocalOnly] = useState(false)
  const { toast } = useToast()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isAIServiceWorking, setIsAIServiceWorking] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null)
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null)
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState<string>("")
  const [scrollOpacity, setScrollOpacity] = useState(1)
  const mainRef = useRef<HTMLElement | null>(null)

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
        setIsLoading(true)
        // Get conversation details first
        const conversation = await getConversation(user.uid, chatId)
        if (conversation) {
          setConversationTitle(conversation.name)
          setCurrentChatId(chatId)
        }

        // Then load messages
        const messages = await getConversationMessages(user.uid, chatId)
        if (messages.length > 0) {
          // Ensure loaded messages don't have the isNew flag
          const messagesWithoutNewFlag = messages.map(msg => ({
            ...msg,
            isNew: false
          }))
          setMessages(messagesWithoutNewFlag)
          setIsChatExpanded(true) // Expand the chat view when loading an existing conversation
        }
      } catch (error) {
        console.error("Error loading chat messages:", error)
        toast({
          title: "Error loading chat",
          description: "Could not load chat messages. Using local mode instead.",
          variant: "destructive",
        })
        setIsLocalOnly(true)
      } finally {
        setIsLoading(false)
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
        // Initialize with empty messages array
        setMessages([])
      } catch (error) {
        console.error("Error initializing chat:", error)
        // Fallback to local-only mode
        setIsLocalOnly(true)
        setMessages([]) // Initialize with empty messages array
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
        const conversations = await getUserConversations(user.uid)
        setRecentConversations(conversations)
      } catch (error) {
        console.error("Error loading recent conversations:", error)
        setRecentConversations([])
      }
    }

    loadRecentConversations()
  }, [user])

  // Update scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return
      const scrollTop = mainRef.current.scrollTop
      const opacity = Math.max(0, Math.min(1, 1 - (scrollTop / 100)))
      setScrollOpacity(opacity)
    }

    const mainElement = mainRef.current
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll)
      return () => mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    // Check if we're in mobile mode (sidebar collapsed and viewport is small)
    const checkMobileMode = () => {
      const isSmallScreen = window.innerWidth < 768 // md breakpoint
      const isCollapsed = document.documentElement.getAttribute('data-sidebar-collapsed') === 'true'
      setIsMobileMode(isCollapsed && isSmallScreen)
    }

    checkMobileMode()
    window.addEventListener('resize', checkMobileMode)
    return () => window.removeEventListener('resize', checkMobileMode)
  }, [])

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return

    setIsChatExpanded(true)

    const message: Message = {
      id: uuidv4(),
      type: 'text',
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, message])
    setInput("")
    setIsLoading(true)

    try {
      let chatId = currentChatId

      // If this is the first message, create a new conversation
      if (!chatId) {
        // Generate a conversation name using the LLM
        const conversationName = await generateConversationName(content)
        chatId = await createConversation(user.uid, conversationName)
        setCurrentChatId(chatId)
        setConversationTitle(conversationName)
        
        // Update recent conversations list
        const updatedConversations = await getUserConversations(user.uid)
        setRecentConversations(updatedConversations)
        
        // Dispatch a custom event to notify the sidebar
        const event = new CustomEvent('conversationCreated', {
          detail: { conversationId: chatId, name: conversationName }
        })
        window.dispatchEvent(event)
      }

      // Save user message to Firestore
      await addMessage(user.uid, chatId, message)

      // Process the message with AI, including previous messages as context
      try {
        const aiResponse = await processAIMessage(
          user.uid,
          content,
          messages, // Pass all previous messages as context
          selectedModel
        )

        if (aiResponse && aiResponse.message) {
          const aiMessage: Message & { isNew?: boolean } = {
            id: uuidv4(),
            type: 'text',
            role: 'assistant',
            content: aiResponse.message.content,
            timestamp: new Date().toISOString(),
            isNew: true // Set isNew flag for new messages
          }

          setMessages((prev) => [...prev, aiMessage])

          // Save AI response to Firestore without the isNew flag
          const { isNew, ...messageToSave } = aiMessage
          await addMessage(user.uid, chatId, messageToSave)
        }
      } catch (aiError) {
        console.error("Error processing AI message:", aiError)
        toast({
          title: "AI Service Error",
          description: "There was a problem connecting to the AI service. Please try again later.",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error in message handling:", error)
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

  // Handle regenerating a message
  const handleRegenerateMessage = async (messageId: string) => {
    if (!user || !currentChatId) return

    setIsLoading(true)
    try {
      // Get the message to regenerate
      const messageToRegenerate = messages.find(m => m.id === messageId)
      if (!messageToRegenerate) return

      // Remove the current message
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      await deleteMessage(user.uid, currentChatId, messageId)

      // Process the message again
      const aiResponse = await processAIMessage(
        user.uid,
        messageToRegenerate.content,
        messages.filter((m) => m.id !== messageId),
        selectedModel
      )

      if (aiResponse && aiResponse.message) {
        const aiMessage: Message = {
          id: uuidv4(),
          type: 'text',
          role: 'assistant',
          content: aiResponse.message.content,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, aiMessage])
        await addMessage(user.uid, currentChatId, aiMessage)
      }
    } catch (error) {
      console.error("Error regenerating message:", error)
      toast({
        title: "Error",
        description: "Failed to regenerate message. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle editing an email
  const handleEditEmail = async (messageId: string) => {
    // TODO: Implement email editing
    console.log("Edit email:", messageId)
  }

  // Handle sending an email
  const handleSendEmail = async (messageId: string) => {
    // TODO: Implement email sending
    console.log("Send email:", messageId)
  }

  // Handle ending a call
  const handleEndCall = async (messageId: string) => {
    if (!user || !currentChatId) return

    try {
      const message = messages.find(m => m.id === messageId)
      if (!message || message.type !== 'phone') return

      // Update the message status
      const updatedMessage: Message = {
        ...message,
        callStatus: 'completed',
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updatedMessage : m))
      )

      await updateMessage(user.uid, currentChatId, messageId, updatedMessage)
    } catch (error) {
      console.error("Error ending call:", error)
      toast({
        title: "Error",
        description: "Failed to end call. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Handle returning to chat
  const handleReturnToChat = () => {
    // TODO: Implement returning to chat
    console.log("Return to chat")
  }

  // Handle deleting a conversation
  const handleDeleteConversation = async () => {
    if (!currentChatId || !user) return

    try {
      await deleteConversation(user.uid, currentChatId)
      router.push('/assistant')
      toast({
        title: "Success",
        description: "Conversation deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Handle renaming a conversation
  const handleRenameConversation = async (newTitle: string) => {
    if (!currentChatId || !user) return

    try {
      await updateConversationName(user.uid, currentChatId, newTitle)
      
      // Update the title in the current conversation
      setConversationTitle(newTitle)
      
      // Update the title in recent conversations
      setRecentConversations(prev => 
        prev.map(conv => 
          conv.id === currentChatId 
            ? { ...conv, name: newTitle }
            : conv
        )
      )
      
      // Dispatch a custom event to notify other components
      const event = new CustomEvent('conversationRenamed', {
        detail: { conversationId: currentChatId, newTitle }
      })
      window.dispatchEvent(event)
      
      toast({
        title: "Success",
        description: "Conversation renamed successfully.",
      })
    } catch (error) {
      console.error("Error renaming conversation:", error)
      toast({
        title: "Error",
        description: "Failed to rename conversation. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
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

  // Add this function to handle speech
  const handleSpeech = (message: string, index: number) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setSpeakingMessageIndex(null)
    } else {
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.onend = () => {
        setIsSpeaking(false)
        setSpeakingMessageIndex(null)
      }
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
      setSpeakingMessageIndex(index)
    }
  }

  // Add this function to generate a conversation name using the LLM
  const generateConversationName = async (message: string): Promise<string> => {
    try {
      // Use a separate API endpoint for title generation
      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          model: selectedModel
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate conversation name");
      }

      const data = await response.json();
      if (!data || !data.title) {
        throw new Error("Invalid response from title generation");
      }

      // Clean up the response to ensure it's a valid title
      let title = data.title.trim();
      // Remove any quotes or special characters
      title = title.replace(/["']/g, '');
      // Remove any markdown formatting
      title = title.replace(/[*_`]/g, '');
      // Ensure it's not too long
      title = title.slice(0, 50);
      // If it's empty or just whitespace, use a default
      if (!title.trim()) {
        title = `Conversation about ${message.slice(0, 30)}...`;
      }

      return title;
    } catch (error) {
      console.error("Error generating conversation name:", error);
      return `Conversation about ${message.slice(0, 30)}...`;
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <NoiseTexture className="flex-1 flex flex-col h-full w-full bg-background dark:bg-neutral-950">
          <div className="flex h-screen flex-col">
            {currentChatId && messages.length > 0 && (
              <div className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-sm transition-all duration-300">
                <div className="h-16 flex items-center px-4">
                  <ChatHeader
                    conversationId={currentChatId}
                    initialTitle={conversationTitle || "New conversation"}
                    onDelete={handleDeleteConversation}
                    onRename={handleRenameConversation}
                  />
                </div>
              </div>
            )}
            <main ref={mainRef} className="flex-1 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
              {!isChatExpanded && (
                <div 
                  className="absolute inset-x-0 top-0 z-30 pointer-events-none transition-opacity duration-200"
                  style={{ 
                    opacity: scrollOpacity,
                    background: 'linear-gradient(to bottom, var(--background) 0%, var(--background) 60%, transparent 100%)',
                    height: '120px'
                  }}
                />
              )}
              <div className={`transition-opacity duration-500 ${isChatExpanded ? "opacity-0" : "opacity-100"}`}>
                <TimeBasedArt />
              </div>
              <div className={`mx-auto max-w-4xl relative z-10 ${isChatExpanded ? "" : "pt-32 mt-16"}`}>
                {!isChatExpanded ? (
                  <div className="space-y-12 relative z-10 mt-8">
                    <div className="flex items-center gap-3">
                      <Sun className="h-8 w-8 text-orange-400" />
                      <h1 className="text-4xl font-semibold text-black dark:text-white">
                        {getGreeting()}, {userData?.firstName || "there"}
                      </h1>
                    </div>

                    <Card className="border-border bg-card/50 p-4">
                      <div className="space-y-4">
                        <div className="border rounded-lg border-border p-3 space-y-3">
                          <div className="relative">
                            <Textarea
                              placeholder="How can I help you today?"
                              value={input}
                              onChange={(e) => {
                                setInput(e.target.value)
                                // Auto-resize the textarea
                                e.target.style.height = 'auto'
                                e.target.style.height = e.target.scrollHeight + 'px'
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault()
                                  setIsChatExpanded(true)
                                  handleSendMessage(input)
                                }
                              }}
                              className="border-0 bg-transparent text-base text-foreground placeholder:text-muted-foreground rounded-lg min-h-[44px] max-h-[200px] resize-none overflow-hidden pr-12"
                              rows={1}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 hover:bg-primary/20"
                              onClick={() => {
                                setIsChatExpanded(true)
                                handleSendMessage(input)
                              }}
                              disabled={!input.trim() || isLoading}
                            >
                              <Send className="h-5 w-5" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <TooltipProvider delayDuration={0}>
                              <div className="flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-muted/80"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={5}>
                                    <p>Attach files</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        "h-8 w-8 rounded-full hover:bg-muted/80 transition-colors",
                                        isWebSearchEnabled && "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                                      )}
                                      onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                                    >
                                      <Globe className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={5}>
                                    <p>Search the internet</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        "h-8 rounded-full px-3 hover:bg-muted/80 gap-1.5 transition-colors",
                                        isReasonEnabled && "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                                      )}
                                      onClick={() => setIsReasonEnabled(!isReasonEnabled)}
                                    >
                                      <LightbulbIcon className="h-4 w-4" />
                                      <span className="text-sm">Reason</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={5}>
                                    <p>Use StarlisThink</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="w-[200px] border-input bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                              <SelectItem value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet</SelectItem>
                              <SelectItem value="claude-3-5-haiku-latest">Claude 3.5 Haiku</SelectItem>
                              <SelectItem value="claude-3-opus-20240229">Claude 3.7 Opus</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                            <SelectTrigger className="w-[150px] border-input bg-background">
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
                                className="border-input bg-background hover:bg-accent"
                                onClick={() => handleSendMessage(action.text)}
                              >
                                <action.icon className={`mr-2 h-4 w-4 ${action.color}`} />
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
                      <div className="space-y-5">
                        {recentConversations.length > 0 ? (
                          recentConversations.map((conversation) => (
                            <Card
                              key={conversation.id}
                              className="cursor-pointer border-neutral-800 p-3 transition-colors hover:bg-neutral-800/50"
                              onClick={() => navigateToConversation(conversation.id)}
                            >
                              <div className="flex justify-between">
                                <h3 className="font-medium text-sm">{conversation.name}</h3>
                                <span className="text-xs">
                                  {conversation.timeLastModified?.toDate() 
                                    ? formatRelativeTime(conversation.timeLastModified.toDate().toISOString())
                                    : 'Just now'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm line-clamp-1 text-muted-foreground">
                                {format(conversation.timeLastModified?.toDate() || new Date(), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </Card>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground">No recent conversations</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-[calc(100vh-4rem)]">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="flex flex-col gap-6 py-8 px-4">
                        {messages.map((message, index) => (
                          <MessageContainer
                            key={message.id}
                            message={message}
                            userData={userData || undefined}
                            onRegenerate={() => handleRegenerateMessage(message.id)}
                            isRegenerating={regeneratingIndex === index}
                            onEditEmail={() => handleEditEmail(message.id)}
                            onSendEmail={() => handleSendEmail(message.id)}
                            onEndCall={() => handleEndCall(message.id)}
                            onReturnToChat={handleReturnToChat}
                            isLastMessage={index === messages.length - 1}
                          />
                        ))}

                        {messages.length === 0 && isChatExpanded && null}

                        {isLoading && (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                            <span>Thinking</span>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Input Area - Fixed at bottom with proper spacing */}
                    <div className={cn(
                      "w-full bg-background/80 backdrop-blur-sm",
                      isMobileMode ? "pb-32" : "pb-6"
                    )}>
                      <div className="max-w-4xl mx-auto px-4">
                        <Card className="rounded-xl overflow-visible bg-background/30 border-0 shadow-lg backdrop-blur-sm">
                          <div className="p-2">
                            <div className="relative">
                              <Textarea
                                placeholder="Ask anything"
                                value={input}
                                onChange={(e) => {
                                  setInput(e.target.value)
                                  e.target.style.height = 'auto'
                                  e.target.style.height = e.target.scrollHeight + 'px'
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    if (!isLoading && !typingMessageIndex) {
                                      handleSendMessage(input)
                                    }
                                  }
                                }}
                                className="border-0 bg-transparent text-base text-foreground placeholder:text-muted-foreground rounded-lg min-h-[44px] max-h-[200px] resize-none overflow-hidden w-full"
                                disabled={typingMessageIndex !== null}
                                rows={1}
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <TooltipProvider delayDuration={0}>
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-muted/80"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={5}>
                                      <p>Attach files</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                          "h-8 w-8 rounded-full hover:bg-muted/80 transition-colors",
                                          isWebSearchEnabled && "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                                        )}
                                        onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                                      >
                                        <Globe className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={5}>
                                      <p>Search the internet</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "h-8 rounded-full px-3 hover:bg-muted/80 gap-1.5 transition-colors",
                                          isReasonEnabled && "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                                        )}
                                        onClick={() => setIsReasonEnabled(!isReasonEnabled)}
                                      >
                                        <LightbulbIcon className="h-4 w-4" />
                                        <span className="text-sm">Reason</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={5}>
                                      <p>Use StarlisThink</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
                                onClick={() => {
                                  if (isLoading) {
                                    setIsLoading(false)
                                    setMessages(prev => prev.slice(0, -1))
                                  } else if (typingMessageIndex !== null) {
                                    setTypingMessageIndex(null)
                                  } else {
                                    handleSendMessage(input)
                                  }
                                }}
                                disabled={!input.trim() && !isLoading && typingMessageIndex === null}
                              >
                                {isLoading || typingMessageIndex !== null ? (
                                  <Square className="h-4 w-4" />
                                ) : (
                                  <ArrowUp className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </NoiseTexture>
      </SidebarInset>
    </SidebarProvider>
  )
}

