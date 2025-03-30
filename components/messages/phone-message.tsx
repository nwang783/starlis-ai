import { PhoneMessage as PhoneMessageType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getGravatarUrl } from '@/lib/utils'
import { Phone, PhoneOff, Volume2, VolumeX, MessageSquare, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface PhoneMessageProps {
  message: PhoneMessageType
  userData?: {
    email: string
    firstName?: string
    lastName?: string
  }
  onEndCall?: () => void
  onReturnToChat?: () => void
}

export function PhoneMessage({ message, userData, onEndCall, onReturnToChat }: PhoneMessageProps) {
  const [isMuted, setIsMuted] = useState(false)

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return ""
    return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
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
          <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Phone Call</span>
              </div>
              <span className="text-xs text-neutral-400">{formatDuration(message.duration)}</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              {message.contactName ? (
                <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <span className="text-neutral-foreground text-lg font-medium">
                    {getInitials(message.contactName)}
                  </span>
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-neutral-600 dark:text-neutral-300" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                {message.contactName && (
                  <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {message.contactName}
                  </div>
                )}
                <div className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                  {formatPhoneNumber(message.phoneNumber)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {onEndCall && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 rounded-full border-red-500 hover:bg-red-500/10"
                  onClick={onEndCall}
                >
                  <PhoneOff className="h-4 w-4 text-red-500" />
                  <span className="sr-only">End Call</span>
                </Button>
              )}

              <Button
                size="icon"
                variant="outline"
                className={cn(
                  "h-10 w-10 rounded-full",
                  !isMuted ? "border-primary bg-white dark:bg-neutral-800" : "border-neutral-300 dark:border-neutral-700"
                )}
                onClick={() => setIsMuted(!isMuted)}
              >
                {!isMuted ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                )}
                <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
              </Button>

              {onReturnToChat && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 rounded-full border-primary hover:bg-primary/10"
                  onClick={onReturnToChat}
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="sr-only">Return to Chat</span>
                </Button>
              )}
            </div>

            {message.notes && (
              <div className="mt-4 pt-4 border-t border-neutral-700">
                <div className="text-sm text-neutral-400">Notes:</div>
                <div className="text-sm">{message.notes}</div>
              </div>
            )}
          </div>
        </div>

        {message.role === "assistant" && (
          <div className="absolute -bottom-10 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/80"
              onClick={() => {
                navigator.clipboard.writeText(message.notes || "")
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