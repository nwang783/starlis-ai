import { TextMessage as TextMessageType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getGravatarUrl } from '@/lib/utils'
import { Copy, Volume2, RefreshCw, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { TypewriterText } from '@/components/typewriter-text'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface TextMessageProps {
  message: TextMessageType & { isNew?: boolean }
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

  const renderContent = () => {
    if (message.role === "assistant" && message.isNew) {
      return (
        <TypewriterText
          text={message.content}
          speed={5}
          className="text-base"
        />
      )
    }

    return (
      <div className="text-base">
        <ReactMarkdown
          components={{
            // Handle code blocks with syntax highlighting
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              if (!inline && match) {
                return (
                  <div className="relative group">
                    <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-muted-foreground">
                        {match[1]}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        onClick={() => {
                          navigator.clipboard.writeText(String(children))
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                )
              }
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              )
            },
            // Handle headings
            h1: ({ children }) => <h1 className="text-2xl font-bold my-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold my-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-bold my-2">{children}</h3>,
            // Handle lists
            ul: ({ children }) => <ul className="list-disc list-inside my-2 text-base">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside my-2 text-base">{children}</ol>,
            // Handle emphasis
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            // Handle blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-muted pl-4 my-2 italic text-base">
                {children}
              </blockquote>
            ),
            // Handle paragraphs
            p: ({ children }) => <p className="my-2 text-base">{children}</p>,
            // Handle list items
            li: ({ children }) => <li className="text-base">{children}</li>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
      {message.role === "assistant" && (
        <Avatar className="h-8 w-8 [&>img]:invert-0 dark:[&>img]:invert">
          <AvatarImage src="/starlis_logo.svg" alt="Starlis Assistant" />
          <AvatarFallback>VX</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("relative group", message.role === "user" ? "flex justify-end" : "")}>
        <div
          className={cn(
            "rounded-2xl p-4",
            message.role === "user" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-foreground"
          )}
          style={{
            maxWidth: '60%',
            minWidth: '120px',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            display: 'inline-block'
          }}
        >
          <div className="whitespace-pre-wrap break-words text-base">
            {renderContent()}
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