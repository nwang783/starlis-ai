import { useState, useEffect, useCallback } from 'react'

interface UseTypewriterOptions {
  speed?: number
  delay?: number
  onComplete?: () => void
}

export function useTypewriter(text: string, options: UseTypewriterOptions = {}) {
  const { speed = 5, delay = 0, onComplete } = options
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  const typeNextCharacter = useCallback(() => {
    if (displayedText.length < text.length) {
      const nextChar = text[displayedText.length]
      const isPunctuation = /[.,!?;:]/.test(nextChar)
      
      // Random chance to pause (1 in 100 characters)
      const shouldPause = Math.random() < 0.01
      
      // Calculate delay based on character type and random pause
      let currentDelay = speed
      if (isPunctuation) {
        currentDelay = speed * 1.5 // Very short pause for punctuation
      } else if (shouldPause) {
        currentDelay = speed * 5 // Shorter random pause
      }
      
      setTimeout(() => {
        setDisplayedText(prev => prev + nextChar)
      }, currentDelay)
    } else {
      setIsTyping(false)
      onComplete?.()
    }
  }, [displayedText, text, speed, onComplete])

  useEffect(() => {
    setDisplayedText('')
    setIsTyping(true)
  }, [text])

  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(typeNextCharacter, delay)
      return () => clearTimeout(timeout)
    }
  }, [isTyping, typeNextCharacter, delay])

  return { displayedText, isTyping }
} 