"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TypewriterTextProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
  onStart?: () => void
  shouldStop?: boolean
}

export function TypewriterText({
  text,
  speed = 40, // Default to 40ms per character
  className,
  onComplete,
  onStart,
  shouldStop = false,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Function to get random delay for more natural typing
  const getRandomDelay = () => {
    // Base delay is the provided speed
    const baseDelay = speed

    // Add random variation between 0.8x and 1.2x the base speed
    const randomMultiplier = 0.8 + Math.random() * 0.4

    // Add occasional longer pauses (2% chance)
    const shouldPause = Math.random() < 0.02
    const pauseDelay = shouldPause ? 100 + Math.random() * 150 : 0 // Random pause between 100-250ms

    return baseDelay * randomMultiplier + pauseDelay
  }

  useEffect(() => {
    if (shouldStop) {
      // If stopped, show full text immediately
      setDisplayedText(text)
      setIsTyping(false)
      onComplete?.()
      return
    }

    if (currentIndex === 0) {
      onStart?.()
    }
    
    if (currentIndex < text.length) {
      const delay = getRandomDelay()
      
      timeoutRef.current = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, delay)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    } else {
      setIsTyping(false)
      onComplete?.()
    }
  }, [currentIndex, text, speed, onComplete, onStart, shouldStop])

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedCode) {
      const timeout = setTimeout(() => {
        setCopiedCode(null)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copiedCode])

  return (
    <div className={cn("relative prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeString = String(children).replace(/\n$/, '')
            
            const handleCopy = () => {
              navigator.clipboard.writeText(codeString)
              setCopiedCode(codeString)
            }

            return !inline && match ? (
              <div className="relative rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900">
                <div className="flex items-center justify-between bg-neutral-800 px-4 py-2 border-b border-neutral-700">
                  <span className="text-sm text-neutral-400">{language}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-neutral-400 hover:text-white"
                    onClick={handleCopy}
                  >
                    {copiedCode === codeString ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <div className="p-4">
                  <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !rounded-none !bg-transparent"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              </div>
            ) : (
              <code {...props} className={cn(className, "bg-muted rounded-sm px-1 py-0.5")}>
                {children}
              </code>
            )
          },
          pre({children}) {
            return <div className="not-prose">{children}</div>
          },
          p({children}) {
            return <p className="mb-4 last:mb-0">{children}</p>
          },
          ul({children}) {
            return <ul className="mb-4 list-disc pl-4 last:mb-0">{children}</ul>
          },
          ol({children}) {
            return <ol className="mb-4 list-decimal pl-4 last:mb-0">{children}</ol>
          },
          li({children}) {
            return <li className="mb-1 last:mb-0">{children}</li>
          },
          h1({children}) {
            return <h1 className="mb-4 text-2xl font-bold last:mb-0">{children}</h1>
          },
          h2({children}) {
            return <h2 className="mb-3 text-xl font-bold last:mb-0">{children}</h2>
          },
          h3({children}) {
            return <h3 className="mb-2 text-lg font-bold last:mb-0">{children}</h3>
          },
          blockquote({children}) {
            return (
              <blockquote className="mb-4 border-l-2 border-neutral-800 pl-4 italic last:mb-0">
                {children}
              </blockquote>
            )
          },
          a({children, href}) {
            return (
              <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            )
          },
          table({children}) {
            return (
              <div className="mb-4 overflow-x-auto last:mb-0">
                <table className="w-full border-collapse border border-neutral-800">
                  {children}
                </table>
              </div>
            )
          },
          th({children}) {
            return (
              <th className="border border-neutral-800 bg-muted px-4 py-2 text-left">
                {children}
              </th>
            )
          },
          td({children}) {
            return (
              <td className="border border-neutral-800 px-4 py-2">
                {children}
              </td>
            )
          }
        }}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  )
} 