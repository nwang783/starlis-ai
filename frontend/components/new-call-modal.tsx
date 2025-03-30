"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { initiateCall } from "@/lib/firebase/calls"

interface NewCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewCallModal({ open, onOpenChange }: NewCallModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [prompt, setPrompt] = useState("")
  const [first_message, setFirstMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, "")
    
    // Format the number as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatPhoneNumber(value)
    setPhoneNumber(formatted)
  }

  const validatePhoneNumber = (number: string): boolean => {
    const cleaned = number.replace(/\D/g, "")
    return cleaned.length === 10 && /^[2-9]\d{9}$/.test(cleaned)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        throw new Error("Please enter a valid 10-digit phone number")
      }

      if (!user) {
        throw new Error("You must be logged in to make a call")
      }

      // Clean the phone number for the API
      const cleanNumber = phoneNumber.replace(/\D/g, "")

      // Try to initiate the call first
      await initiateCall(user.uid, cleanNumber, prompt, first_message)

      // Only navigate if the call was initiated successfully
      router.push(
        `/call?number=${encodeURIComponent(cleanNumber)}&prompt=${encodeURIComponent(
          prompt
        )}&first_message=${encodeURIComponent(first_message)}`
      )
      onOpenChange(false)
    } catch (error) {
      console.error("Error starting call:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start call. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Call</DialogTitle>
            <DialogDescription>
              Start a new call with an AI assistant. Enter the phone number and
              provide instructions for the AI.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+1</span>
                <Input
                  id="phone"
                  placeholder="(555) 555-5555"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="pl-12"
                  maxLength={14}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prompt">AI Instructions</Label>
              <Textarea
                id="prompt"
                placeholder="You are a helpful customer service agent..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="first_message">First Message</Label>
              <Textarea
                id="first_message"
                placeholder="Hello! How can I help you today?"
                value={first_message}
                onChange={(e) => setFirstMessage(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              <Phone className="mr-2 h-4 w-4" />
              Start Call
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 