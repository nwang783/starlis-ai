import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, RefreshCw, Edit2, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  content: string
  isUser: boolean
  isLastMessage: boolean
  onRegenerate?: () => void
  onEdit?: (newContent: string) => void
  className?: string
}

export function MessageActions({
  content,
  isUser,
  isLastMessage,
  onRegenerate,
  onEdit,
  className,
}: MessageActionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(content)
    speechSynthesis.speak(utterance)
  }

  const handleEditSubmit = () => {
    if (onEdit) {
      onEdit(editedContent)
      setIsEditing(false)
    }
  }

  const handleEditCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className={cn('flex gap-2 mt-2', className)}>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="flex-1 p-2 rounded-lg border border-input bg-background"
          rows={3}
        />
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleEditSubmit}
            className="h-8"
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEditCancel}
            className="h-8"
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity', className)}>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        className="h-8"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSpeak}
        className="h-8"
      >
        <Volume2 className="h-4 w-4" />
      </Button>
      {isUser && isLastMessage && onEdit && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-8"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
      {!isUser && isLastMessage && onRegenerate && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRegenerate}
          className="h-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
} 