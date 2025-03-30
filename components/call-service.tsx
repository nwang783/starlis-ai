"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { CallCard } from "./call-card"

interface CallServiceProps {
  onCallEnded?: (transcript: string[]) => void
}

export function CallService({ onCallEnded }: CallServiceProps) {
  const { user } = useAuth()
  const [activeCall, setActiveCall] = useState<{
    callSid: string
    phoneNumber: string
    contactName?: string
  } | null>(null)

  // Check for any active calls on component mount
  useEffect(() => {
    // This would typically check a database or local storage for active calls
    // For now, we'll just check if there's an active call in session storage
    const storedCall = sessionStorage.getItem("activeCall")
    if (storedCall) {
      try {
        const callData = JSON.parse(storedCall)
        setActiveCall(callData)
      } catch (error) {
        console.error("Error parsing stored call data:", error)
        sessionStorage.removeItem("activeCall")
      }
    }
  }, [])

  // Function to initiate a call
  const initiateCall = async (phoneNumber: string, contactName?: string) => {
    if (!user) return null

    try {
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          phoneNumber,
          name: contactName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to initiate call")
      }

      const data = await response.json()

      const newCall = {
        callSid: data.callSid,
        phoneNumber,
        contactName,
      }

      // Store call data in session storage
      sessionStorage.setItem("activeCall", JSON.stringify(newCall))

      setActiveCall(newCall)
      return data.callSid
    } catch (error) {
      console.error("Error initiating call:", error)
      return null
    }
  }

  // Handle call ended
  const handleCallEnded = (transcript: string[]) => {
    // Clear active call
    setActiveCall(null)
    sessionStorage.removeItem("activeCall")

    // Call parent callback if provided
    if (onCallEnded) {
      onCallEnded(transcript)
    }
  }

  // Expose the initiateCall function and activeCall state
  return {
    initiateCall,
    activeCall,
    CallCard: activeCall ? (
      <CallCard
        callSid={activeCall.callSid}
        phoneNumber={activeCall.phoneNumber}
        contactName={activeCall.contactName}
        onCallEnded={handleCallEnded}
      />
    ) : null,
  }
}

