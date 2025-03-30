"use client"

import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function TestCallButton() {
  const triggerTestCall = () => {
    // Create a test call in session storage
    const testCallData = {
      callSid: "test-call-" + Date.now(),
      phoneNumber: "+1 (555) 123-4567",
      contactName: "Test Call",
      callStatus: "in-progress",
    }

    // Store in session storage
    sessionStorage.setItem("activeCall", JSON.stringify(testCallData))

    // Show a notification that the test call was triggered
    toast({
      title: "Test Call Triggered",
      description: "A test call toast should appear shortly.",
      duration: 3000,
    })

    // Force refresh the page to ensure the toast provider picks up the change
    window.location.reload()
  }

  return (
    <Button onClick={triggerTestCall} className="fixed bottom-4 left-4 z-50" size="sm">
      <Phone className="mr-2 h-4 w-4" />
      Test Call Toast
    </Button>
  )
}

