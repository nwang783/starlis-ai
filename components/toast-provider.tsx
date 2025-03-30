"use client"

import { useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/hooks/use-toast"
import { User, PhoneOff, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ToastProvider() {
  // Check for active calls on component mount
  useEffect(() => {
    const checkForActiveCall = () => {
      const storedCall = sessionStorage.getItem("activeCall")
      if (storedCall) {
        try {
          const callData = JSON.parse(storedCall)

          // Only show toast if it's not already visible
          if (!document.querySelector(`[data-toast-id="call-${callData.callSid}"]`)) {
            displayCallToast(callData)
          }
        } catch (error) {
          console.error("Error parsing stored call data:", error)
        }
      }
    }

    // Check immediately on mount
    checkForActiveCall()

    // Set up an interval to periodically check for active calls
    const checkInterval = setInterval(checkForActiveCall, 5000)

    return () => {
      clearInterval(checkInterval)
    }
  }, [])

  // Function to display call toast
  const displayCallToast = (callData: any) => {
    const { callSid, phoneNumber, contactName, callStatus } = callData

    // Format phone number
    const formatPhoneNumber = (phoneNumber: string) => {
      if (!phoneNumber) return ""
      const cleaned = phoneNumber.replace(/\D/g, "")
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
      } else if (cleaned.length === 11 && cleaned[0] === "1") {
        return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
      }
      return phoneNumber
    }

    // Get initials
    const getInitials = (name: string) => {
      if (!name) return "?"
      return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    }

    // Handle end call
    const handleEndCall = () => {
      toast.dismiss(`call-${callSid}`)
      sessionStorage.removeItem("activeCall")
    }

    // Show toast
    toast({
      id: `call-${callSid}`,
      title: "Active Call",
      description: (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 p-4 shadow-lg w-full">
          {/* Call status and duration */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {callStatus === "in-progress" ? "Connected" : callStatus || "Connected"}
            </span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">00:00</span>
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-3 mb-4">
            {contactName ? (
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-lg font-medium">{getInitials(contactName)}</span>
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <User className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
              </div>
            )}

            <div>
              {contactName && <div className="font-medium text-zinc-900 dark:text-zinc-100">{contactName}</div>}
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {formatPhoneNumber(phoneNumber) || "Unknown number"}
              </div>
            </div>
          </div>

          {/* Call controls */}
          <div className="flex items-center justify-center gap-6">
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full border-red-500 hover:bg-red-500/10"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-5 w-5 text-red-500" />
              <span className="sr-only">End Call</span>
            </Button>

            <Button
              size="icon"
              variant="outline"
              className={cn("h-12 w-12 rounded-full", "border-primary bg-primary/10")}
            >
              <Volume2 className="h-5 w-5 text-primary" />
              <span className="sr-only">Speaker</span>
            </Button>
          </div>
        </div>
      ),
      duration: Number.POSITIVE_INFINITY,
      className: "call-toast-container",
    })
  }

  return <Toaster />
}

