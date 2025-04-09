import { useState, useRef, useCallback } from 'react'

interface UseChatOptions {
  onStop?: () => void
  onError?: (error: Error) => void
}

interface UseChatReturn {
  sendPrompt: (prompt: string) => Promise<void>
  stopGenerating: () => void
  isGenerating: boolean
  abortController: AbortController | null
}

export function useChat({ onStop, onError }: UseChatOptions = {}): UseChatReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const partialResponseRef = useRef<string>('')

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsGenerating(false)
      onStop?.()
    }
  }, [onStop])

  const sendPrompt = useCallback(async (prompt: string) => {
    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()
      setIsGenerating(true)
      partialResponseRef.current = ''

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        const chunk = decoder.decode(value)
        partialResponseRef.current += chunk

        // Here you would typically update your UI with the new chunk
        // For example, using a state setter passed as a prop
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, no need to show error
        return
      }
      onError?.(error as Error)
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [onError])

  return {
    sendPrompt,
    stopGenerating,
    isGenerating,
    abortController: abortControllerRef.current,
  }
} 