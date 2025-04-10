import { Message } from "@/lib/types"
import { UserData } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { RefreshCw, Square, Copy, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useState, ReactNode, isValidElement, Children } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { CodeBlock } from "./code-block"
import { useTypewriter } from "@/hooks/use-typewriter"
import { MessageActions } from './message-actions'
import type { Components } from 'react-markdown'

const isUserMessage = (message: Message): boolean => message.role === 'user'
const isAssistantMessage = (message: Message): boolean => message.role === 'assistant'

type MessageRole = 'user' | 'assistant'

interface MessageContainerProps {
  message: Message
  userData?: UserData
  onRegenerate: (messageId: string) => void
  isRegenerating: boolean
  onEditEmail: (messageId: string) => void
  onSendEmail: (messageId: string) => void
  onEndCall: (messageId: string) => void
  onReturnToChat: () => void
  isLastMessage: boolean
}

// Add these type definitions
type MathComponentProps = {
  value: string;
};

// Extend the Components type to include our math components
type CustomComponents = Components & {
  math: React.ComponentType<MathComponentProps>;
  inlineMath: React.ComponentType<MathComponentProps>;
};

export function MessageContainer({
  message,
  userData,
  onRegenerate,
  isRegenerating,
  onEditEmail,
  onSendEmail,
  onEndCall,
  onReturnToChat,
  isLastMessage,
}: MessageContainerProps) {
  const { toast } = useToast()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [displayedText, setDisplayedText] = useState(message.content)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied to your clipboard.",
      })
    } catch (error) {
      console.error("Failed to copy text:", error)
      toast({
        title: "Error",
        description: "Failed to copy message to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(message.content)
      utterance.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  const formatTimestamp = (timestamp: string | { toDate: () => Date }) => {
    if (typeof timestamp === 'string') {
      return format(new Date(timestamp), "h:mm a")
    }
    return format(timestamp.toDate(), "h:mm a")
  }

  if (message.role === "user") {
    return (
      <div 
        className="w-full group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="space-y-4 flex flex-col items-end">
          <div className="max-w-[80%]">
            <div className="rounded-2xl bg-primary/10 text-foreground px-4 py-2">
              {message.content}
            </div>
          </div>
          <MessageActions
            content={message.content}
            isUser={isUserMessage(message)}
            isLastMessage={isLastMessage}
            onRegenerate={isAssistantMessage(message) && isLastMessage && !isRegenerating ? () => onRegenerate(message.id) : undefined}
            onEdit={isUserMessage(message) && isLastMessage ? (newContent) => {
              // Handle message edit
              console.log('Edit message:', newContent)
            } : undefined}
            className="justify-end"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full group">
      <div className="space-y-4">
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '')
                return match ? (
                  <CodeBlock
                    language={match[1]}
                    value={String(children).replace(/\n$/, '')}
                    className="my-4"
                  />
                ) : (
                  <code className={cn("bg-muted px-1 py-0.5 rounded", className)} {...props}>
                    {children}
                  </code>
                )
              },
              math: ({ value }: MathComponentProps) => (
                <div className="math math-display my-4" style={{ display: 'block' }}>
                  {value}
                </div>
              ),
              inlineMath: ({ value }: MathComponentProps) => (
                <span className="math math-inline">
                  {value}
                </span>
              ),
              p: ({ children }) => {
                // Check if the paragraph contains a math display block
                const hasMathDisplay = Children.toArray(children).some(
                  child => isValidElement(child) && 
                    typeof child.props === 'object' && 
                    child.props !== null &&
                    'className' in child.props &&
                    typeof child.props.className === 'string' &&
                    child.props.className.includes('math-display')
                )
                
                // If it contains a math display block, don't wrap in p tag
                if (hasMathDisplay) {
                  return <div className="mb-4 last:mb-0">{children}</div>
                }
                
                return <p className="mb-4 last:mb-0">{children}</p>
              },
              h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              table: ({ children }) => (
                <div className="overflow-x-auto">
                  <table className="border-collapse w-full mb-4">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border px-4 py-2 text-left">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-4 py-2">{children}</td>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-border pl-4 italic my-4">
                  {children}
                </blockquote>
              ),
            } as CustomComponents}
          >
            {message.isNew ? useTypewriter(message.content).displayedText : message.content}
          </ReactMarkdown>
        </div>
        <MessageActions
          content={message.content}
          isUser={isUserMessage(message)}
          isLastMessage={isLastMessage}
          onRegenerate={isAssistantMessage(message) && isLastMessage && !isRegenerating ? () => onRegenerate(message.id) : undefined}
          onEdit={isUserMessage(message) && isLastMessage ? (newContent) => {
            // Handle message edit
            console.log('Edit message:', newContent)
          } : undefined}
          className={isUserMessage(message) ? 'justify-end' : 'justify-start'}
        />
      </div>
    </div>
  )
} 