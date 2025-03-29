"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI Secretary. How can I assist you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        role: "assistant",
        content:
          "I'm processing your request. As your AI Secretary, I can help schedule meetings, manage emails, and make calls for you. What would you like me to do?",
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-xl font-bold">AI Secretary</h1>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4 pt-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex w-max max-w-[80%] flex-col gap-2 rounded-3xl px-4 py-3",
                message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {message.content}
            </div>
          ))}

          {isLoading && (
            <div className="flex w-max max-w-[80%] flex-col gap-2 rounded-3xl bg-muted px-4 py-3">
              <div className="flex gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0.2s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="rounded-3xl"
          />
          <Button type="submit" size="icon" className="rounded-full">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </footer>
    </div>
  )
}

