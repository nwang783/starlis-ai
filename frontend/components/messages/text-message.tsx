import { TextMessage as TextMessageType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getGravatarUrl } from '@/lib/utils'
import { Copy, Volume2, RefreshCw, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface TextMessageProps {
  message: TextMessageType
  userData?: {
    email: string
    firstName?: string
    lastName?: string
  }
  onRegenerate?: () => void
  isRegenerating?: boolean
}

export function TextMessage({ message, userData, onRegenerate, isRegenerating }: TextMessageProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)

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

  return (
    <div className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
      {message.role === "assistant" && (
        <Avatar className="h-8 w-8 [&>img]:invert-0 dark:[&>img]:invert">
          <AvatarImage src="/starlis_logo.svg" alt="Starlis Assistant" />
          <AvatarFallback>VX</AvatarFallback>
        </Avatar>
      )}

      <div className="relative group">
        <div
          className={cn(
            "max-w-[80%] rounded-2xl p-4",
            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>

        {message.role === "assistant" && (
          <div className="absolute -bottom-10 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/80"
              onClick={() => {
                navigator.clipboard.writeText(message.content)
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/80"
              onClick={handleSpeech}
            >
              {isSpeaking ? (
                <Square className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={cn("h-3 w-3", isRegenerating && "animate-spin")} />
              </Button>
            )}
          </div>
        )}
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
  )
} 