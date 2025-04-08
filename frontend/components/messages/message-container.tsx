import { Message } from "@/lib/types"
import { UserData } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { RefreshCw, Square, Copy, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CodeBlock } from "./code-block"
import { useTypewriter } from "@/hooks/use-typewriter"

interface MessageContainerProps {
  message: Message
  userData?: UserData
  onRegenerate?: (messageId: string) => void
  isRegenerating?: boolean
  onEditEmail?: (messageId: string) => void
  onSendEmail?: (messageId: string) => void
  onEndCall?: (messageId: string) => void
  onReturnToChat?: () => void
}

export function MessageContainer({
  message,
  userData,
  onRegenerate,
  isRegenerating,
  onEditEmail,
  onSendEmail,
  onEndCall,
  onReturnToChat,
}: MessageContainerProps) {
  const { toast } = useToast()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

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
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <div className="rounded-2xl bg-primary/10 text-foreground px-4 py-2">
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="w-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="space-y-4">
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
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
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
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
            }}
          >
            {message.isNew ? useTypewriter(message.content).displayedText : message.content}
          </ReactMarkdown>
        </div>
        <div className="flex items-center gap-1 h-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleSpeech}
          >
            <Volume2 className={cn("h-4 w-4", isSpeaking && "text-primary")} />
          </Button>
          {onRegenerate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRegenerate(message.id)}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Square className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 