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
import { Paperclip, Send, Sun, Calendar, Mail, Phone, Copy, Volume2, RefreshCw, Square, Globe, Plus, LightbulbIcon, ArrowUp, BrainCircuit, Sparkles, MessageSquare, FileText, Search, Bot, ChevronDown, ChevronUp, X, Loader2, Sparkles as SparklesIcon, MessageSquare as MessageSquareIcon, FileText as FileTextIcon, Search as SearchIcon, ArrowRight, Settings, PanelRight } from "lucide-react"
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
import { RightCanvas } from "@/components/right-canvas"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { RightSideDrawer } from "@/components/right-side-drawer"
import { ModelLibrary } from "@/components/model-library"
import { Switch } from "@/components/ui/switch"

// Quick action suggestions
const quickPrompts = [
  {
    text: "What can you help me with?",
    icon: <SparklesIcon className="h-4 w-4" />,
  },
  {
    text: "Tell me about your features",
    icon: <MessageSquareIcon className="h-4 w-4" />,
  },
  {
    text: "How do I get started?",
    icon: <FileTextIcon className="h-4 w-4" />,
  },
]

export default function AssistantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userData } = useAuth()
  const { state: sidebarState, setOpen } = useSidebar()
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false)
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false)
  const [requireConfirmation, setRequireConfirmation] = useState(true)
  const [isModelDrawerOpen, setIsModelDrawerOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedMessage, setStreamedMessage] = useState("")
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [isTitleEditing, setIsTitleEditing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState("balanced")
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false)
  const [isReasonEnabled, setIsReasonEnabled] = useState(false)
  const [recentConversations, setRecentConversations] = useState<any[]>([])
  const [isLocalOnly, setIsLocalOnly] = useState(false)
  const [isAIServiceWorking, setIsAIServiceWorking] = useState(true)
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [scrollOpacity, setScrollOpacity] = useState(1)
  const mainRef = useRef<HTMLElement | null>(null)
  const [isChatInitialized, setIsChatInitialized] = useState(false)

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

  // Create a new chat if no chatId is provided
  useEffect(() => {
    const initializeChat = async () => {
      if (!user || searchParams.get("chat")) return // Skip if user is not logged in or chatId exists

      setIsLoading(true)
      try {
        // Initialize with empty messages array
        setMessages([])
        setIsChatInitialized(true)
      } catch (error) {
        console.error("Error initializing chat:", error)
        // Fallback to local-only mode
        setIsLocalOnly(true)
        setMessages([]) // Initialize with empty messages array
        setIsChatInitialized(true)
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
  }, [user, searchParams.get("chat"), toast])

  // Load chat messages if chatId is provided
  useEffect(() => {
    const loadChatMessages = async () => {
      if (!user || !searchParams.get("chat")) return

      try {
        setIsLoading(true)
        // Get conversation details first
        const conversation = await getConversation(user.uid, searchParams.get("chat"))
        if (conversation) {
          setConversationTitle(conversation.name)
          setCurrentChatId(searchParams.get("chat"))
        }

        // Then load messages
        const messages = await getConversationMessages(user.uid, searchParams.get("chat"))
        if (messages.length > 0) {
          // Ensure loaded messages don't have the isNew flag
          const messagesWithoutNewFlag = messages.map(msg => ({
            ...msg,
            isNew: false
          }))
          setMessages(messagesWithoutNewFlag)
          setIsChatExpanded(true) // Expand the chat view when loading an existing conversation
        }
        setIsChatInitialized(true)
      } catch (error) {
        console.error("Error loading chat messages:", error)
        toast({
          title: "Error loading chat",
          description: "Could not load chat messages. Using local mode instead.",
          variant: "destructive",
        })
        setIsLocalOnly(true)
        setIsChatInitialized(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadChatMessages()
  }, [user, searchParams.get("chat"), toast])

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
      setIsMobile(isCollapsed && isSmallScreen)
    }

    checkMobileMode()
    window.addEventListener('resize', checkMobileMode)
    return () => window.removeEventListener('resize', checkMobileMode)
  }, [])

  // Add effect to handle sidebar state when right sidebar opens/closes
  useEffect(() => {
    if (isRightSidebarOpen && sidebarState === "expanded") {
      // Only collapse if we're on mobile
      if (isMobile) {
        setOpen(false)
      }
    }
  }, [isRightSidebarOpen, sidebarState, setOpen, isMobile])

  // Add effect to handle initial collapse when canvas opens
  useEffect(() => {
    if (isRightSidebarOpen && sidebarState === "expanded") {
      setOpen(false)
    }
  }, [isRightSidebarOpen]) // Only run when canvas opens/closes

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

    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    setRegeneratingIndex(messageIndex)
    setIsLoading(true)

    try {
      // Get the message to regenerate
      const messageToRegenerate = messages[messageIndex]
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
      setRegeneratingIndex(null)
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

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    setIsChatExpanded(true)
    handleSendMessage(prompt)
  }

  // Add this after the existing models array
  const allModels = [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      company: "OpenAI",
      description: "Most capable model for complex tasks",
      isSelected: selectedModel === "gpt-4o",
      icon: (
        <Image
          src="/openai-logo.svg"
          alt="OpenAI Logo"
          width={16}
          height={16}
          className="dark:brightness-0 dark:invert brightness-0"
        />
      )
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      company: "OpenAI",
      description: "Fast and efficient for most tasks",
      isSelected: selectedModel === "gpt-4-turbo",
      icon: (
        <Image
          src="/openai-logo.svg"
          alt="OpenAI Logo"
          width={16}
          height={16}
          className="dark:brightness-0 dark:invert brightness-0"
        />
      )
    },
    {
      id: "claude-3-7-sonnet-latest",
      name: "Claude 3.7 Sonnet",
      company: "Anthropic",
      description: "Balanced performance for most tasks",
      isSelected: selectedModel === "claude-3-7-sonnet-latest",
      icon: (
        <Image
          src="/anthropic-logo.svg"
          alt="Anthropic Logo"
          width={16}
          height={16}
          className="dark:brightness-0 dark:invert brightness-0"
        />
      )
    },
    {
      id: "claude-3-5-haiku-latest",
      name: "Claude 3.5 Haiku",
      company: "Anthropic",
      description: "Fast and efficient for simple tasks",
      isSelected: selectedModel === "claude-3-5-haiku-latest",
      icon: (
        <Image
          src="/anthropic-logo.svg"
          alt="Anthropic Logo"
          width={16}
          height={16}
          className="dark:brightness-0 dark:invert brightness-0"
        />
      )
    },
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3.7 Opus",
      company: "Anthropic",
      description: "Most advanced model for research",
      isSelected: selectedModel === "claude-3-opus-20240229",
      icon: (
        <Image
          src="/anthropic-logo.svg"
          alt="Anthropic Logo"
          width={16}
          height={16}
          className="dark:brightness-0 dark:invert brightness-0"
        />
      )
    },
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      company: "Google",
      description: "Advanced model for complex reasoning",
      isSelected: selectedModel === "gemini-pro",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          className="h-4 w-4 dark:brightness-0 dark:invert brightness-0"
        >
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )
    },
    {
      id: "gemini-ultra",
      name: "Gemini Ultra",
      company: "Google",
      description: "Most capable model for advanced tasks",
      isSelected: selectedModel === "gemini-ultra",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          className="h-4 w-4 dark:brightness-0 dark:invert brightness-0"
        >
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )
    }
  ]

  return (
    <div className="flex h-screen w-full overscroll-none overflow-hidden">
      <AppSidebar />
      <div className={cn(
        "flex-1 flex flex-col h-full transition-all duration-300 ease-in-out overscroll-none overflow-hidden",
        isRightSidebarOpen ? "mr-[50vw]" : ""
      )}>
        <NoiseTexture className="flex-1 flex flex-col h-full w-full bg-background overscroll-none overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overscroll-none overflow-hidden">
            {/* Fixed Header - Always at top */}
            <div className={cn(
              "sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b transition-opacity duration-300",
              !currentChatId && messages.length === 0 ? "opacity-0" : "opacity-100"
            )}>
              <div className="h-16 flex items-center justify-between px-4">
                  <ChatHeader
                    conversationId={currentChatId}
                    initialTitle={conversationTitle || "New conversation"}
                    onDelete={handleDeleteConversation}
                    onRename={handleRenameConversation}
                  />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted/80"
                  onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                >
                  <PanelRight className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isRightSidebarOpen && "rotate-180"
                  )} />
                </Button>
                </div>
              </div>

            <main ref={mainRef} className="flex-1 flex flex-col overscroll-none overflow-hidden">
              {!isChatExpanded && (
                <div 
                  className="absolute inset-x-0 top-0 z-30 pointer-events-none transition-opacity duration-300"
                  style={{ 
                    opacity: scrollOpacity,
                    background: 'linear-gradient(to bottom, var(--background) 0%, var(--background) 60%, transparent 100%)',
                    height: '120px'
                  }}
                />
              )}
              <div className={`transition-all duration-300 ease-in-out ${isChatExpanded ? "opacity-0" : "opacity-100"}`}>
                <TimeBasedArt />
              </div>
              <div className={`flex-1 flex flex-col mx-auto w-full relative z-10 transition-all duration-300 ease-in-out overscroll-none overflow-y-auto ${isChatExpanded ? "" : "pt-16 mt-16"}`}>
                {!isChatExpanded ? (
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] relative z-10 transition-all duration-300 ease-in-out">
                    {/* Gradient Background */}
                    <div 
                      className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
                      style={{ 
                        background: 'linear-gradient(to bottom, var(--background) 0%, var(--background) 30%, transparent 100%)',
                        opacity: scrollOpacity
                      }}
                    />

                    {/* Main Content */}
                    <div className="relative z-10 w-full max-w-3xl mx-auto px-8 space-y-6">
                      {/* Greeting */}
                      <div className="flex flex-col items-center space-y-3">
                        <Sun className="h-10 w-10 text-orange-400" />
                        <h1 className="text-4xl font-semibold text-center text-black dark:text-white">
                          {getGreeting()}, {userData?.firstName || "there"}
                        </h1>
                        </div>

                      {/* Quick Prompts */}
                          <div className="flex flex-wrap gap-2">
                        {quickPrompts.map((prompt, index) => (
                          <button
                                key={index}
                            onClick={() => handleQuickPrompt(prompt.text)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
                          >
                            {prompt.icon}
                            {prompt.text}
                          </button>
                            ))}
                          </div>
                        </div>
                      </div>
                ) : (
                  <div className="flex flex-col h-full overscroll-none overflow-hidden">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto overscroll-none">
                      <div className="flex flex-col gap-6 py-12 px-8 max-w-4xl mx-auto overscroll-none">
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
                  </div>
                )}

                {/* Message Prompt Container */}
                <div className="sticky bottom-0 w-full bg-background/80 backdrop-blur-sm z-50">
                  <div className="w-full px-8 pt-4 pb-8 max-w-3xl mx-auto">
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

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 rounded-full px-3 hover:bg-muted/80 gap-1.5"
                                        >
                                          {selectedModel ? (
                                            <>
                                              {allModels.find(model => model.id === selectedModel)?.icon}
                                              <span className="text-sm">{selectedModel}</span>
                                            </>
                                          ) : (
                                            <>
                                              <BrainCircuit className="h-4 w-4" />
                                              <span className="text-sm">Select Model</span>
                                            </>
                                          )}
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="w-64">
                                        {allModels.slice(0, 3).map((model) => (
                                          <DropdownMenuItem
                                            key={model.id}
                                            onClick={() => setSelectedModel(model.id)}
                                            className="flex items-start gap-2"
                                          >
                                            <div className="flex items-center gap-2">
                                              {model.icon}
                                              <div>
                                                <div className="font-medium">{model.name}</div>
                                                <div className="text-xs text-muted-foreground">{model.description}</div>
                                </div>
                                            </div>
                                          </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuItem
                                          onClick={() => setIsModelDrawerOpen(true)}
                                          className="flex items-center justify-between text-muted-foreground"
                                        >
                                          <span>View more models</span>
                                          <ArrowRight className="h-4 w-4" />
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={5}>
                                    <p>Change model</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 rounded-full hover:bg-muted/80"
                                        >
                                          <Settings className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-64">
                                        <div className="flex items-center justify-between px-2 py-1.5">
                                          <span className="text-sm">Require confirmation before taking actions</span>
                                          <Switch
                                            checked={requireConfirmation}
                                            onCheckedChange={setRequireConfirmation}
                                          />
                                        </div>
                                        <DropdownMenuItem
                                          onClick={() => setIsSettingsDrawerOpen(true)}
                                          className="flex items-center justify-between text-muted-foreground"
                                        >
                                          <span>View more settings</span>
                                          <ArrowRight className="h-4 w-4" />
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={5}>
                                    <p>Quick settings</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
            </main>
          </div>
        </NoiseTexture>
      </div>

      {/* Right Canvas */}
      <RightCanvas isOpen={isRightSidebarOpen} onClose={() => setIsRightSidebarOpen(false)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Canvas Content</h3>
          <p>Add your canvas content here</p>
        </div>
      </RightCanvas>

      <RightSideDrawer
        isOpen={isModelDrawerOpen}
        onClose={() => setIsModelDrawerOpen(false)}
        title="Model Library"
      >
        <ModelLibrary
          models={allModels}
          onSelectModel={(modelId) => {
            setSelectedModel(modelId)
            setIsModelDrawerOpen(false)
          }}
        />
      </RightSideDrawer>

      <RightSideDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        title="Quick Settings"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search settings..."
              className="flex-1"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm">Require confirmation before taking actions</span>
                <p className="text-xs text-muted-foreground">The assistant will confirm with you before taking any irreversible actions</p>
              </div>
              <Switch
                checked={requireConfirmation}
                onCheckedChange={setRequireConfirmation}
              />
            </div>
            {/* Add more settings here */}
          </div>
        </div>
      </RightSideDrawer>
    </div>
  )
}

