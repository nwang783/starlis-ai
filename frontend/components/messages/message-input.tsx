import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Square } from 'lucide-react'
import { useChat } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSend: (message: string) => void
  className?: string
}

export function MessageInput({ onSend, className }: MessageInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendPrompt, stopGenerating, isGenerating } = useChat({
    onStop: () => {
      // Handle any cleanup after stopping generation
      console.log('Generation stopped')
    },
    onError: (error) => {
      console.error('Error during generation:', error)
    }
  })

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isGenerating) return

    const message = input.trim()
    setInput('')
    onSend(message) // Call the parent's onSend first
    await sendPrompt(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    if (isGenerating) {
      e.preventDefault()
      stopGenerating()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="min-h-[44px] max-h-[200px] resize-none"
        disabled={isGenerating}
      />
      <Button
        type={isGenerating ? 'button' : 'submit'}
        size="icon"
        variant="ghost"
        className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
        disabled={!input.trim() && !isGenerating}
        onClick={handleButtonClick}
      >
        {isGenerating ? (
          <Square className="h-4 w-4" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
} 