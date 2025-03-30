import { CodeboxMessage as CodeboxMessageType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getGravatarUrl } from '@/lib/utils'
import { Copy, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeMessageProps {
  message: CodeboxMessageType
  userData?: {
    email: string
    firstName?: string
    lastName?: string
  }
}

export function CodeMessage({ message, userData }: CodeMessageProps) {
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
          <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Code Snippet</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 rounded-full p-0"
                onClick={() => {
                  navigator.clipboard.writeText(message.content)
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-2 rounded-lg overflow-hidden">
              <SyntaxHighlighter
                language={message.language || 'typescript'}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                }}
              >
                {message.content}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
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