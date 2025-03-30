import { Message } from '@/lib/types'
import { TextMessage } from './text-message'
import { EmailMessage } from './email-message'
import { CodeMessage } from './code-message'
import { PhoneMessage } from './phone-message'

interface MessageContainerProps {
  message: Message
  userData?: {
    email: string
    firstName?: string
    lastName?: string
  }
  onRegenerate?: () => void
  isRegenerating?: boolean
  onEditEmail?: () => void
  onSendEmail?: () => void
  onEndCall?: () => void
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
  switch (message.type) {
    case 'text':
      return (
        <TextMessage
          message={message}
          userData={userData}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
        />
      )
    case 'email':
      return (
        <EmailMessage
          message={message}
          userData={userData}
          onEdit={onEditEmail}
          onSend={onSendEmail}
        />
      )
    case 'codebox':
      return <CodeMessage message={message} userData={userData} />
    case 'phone':
      return (
        <PhoneMessage
          message={message}
          userData={userData}
          onEndCall={onEndCall}
          onReturnToChat={onReturnToChat}
        />
      )
    default:
      return null
  }
} 