import { EmailMessage as EmailMessageType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getGravatarUrl } from '@/lib/utils'
import { Mail, Pencil, Send, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface EmailMessageProps {
  message: EmailMessageType
  userData?: {
    email: string
    firstName?: string
    lastName?: string
  }
  onEdit?: () => void
  onSend?: () => void
}

export function EmailMessage({ message, userData, onEdit, onSend }: EmailMessageProps) {
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
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Email Draft</span>
              </div>
              <div className="flex gap-1">
                {onEdit && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 rounded-full p-0" onClick={onEdit}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onSend && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 rounded-full p-0" onClick={onSend}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex gap-2">
                <span className="font-medium text-neutral-400">To:</span>
                <span>{message.recipient}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-neutral-400">Subject:</span>
                <span>{message.subject}</span>
              </div>
            </div>
            <Separator className="my-2 bg-neutral-700" />
            <div className="text-sm">
              {message.body}
            </div>
          </div>
        </div>

        {message.role === "assistant" && (
          <div className="absolute -bottom-10 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/80"
              onClick={() => {
                navigator.clipboard.writeText(message.body)
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
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