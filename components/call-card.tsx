"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PhoneOff, Volume2, User, VolumeX, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface CallCardProps {
  callSid: string
  phoneNumber: string
  contactName?: string
  onCallEnded?: (transcript: string[]) => void
  isDemo?: boolean
}

export function CallCard({ callSid, phoneNumber, contactName, onCallEnded, isDemo = false }: CallCardProps) {
  const { user } = useAuth()
  const [callStatus, setCallStatus] = useState<string>("connecting")
  const [callDuration, setCallDuration] = useState<number>(0)
  const [transcript, setTranscript] = useState<string[]>([])
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Mock function to find contact - replace with actual implementation
  const findContactByPhoneNumber = (number) => {
    // This should be replaced with actual contact lookup logic
    // For now, return null to use the default UI
    return null
  }

  // Mock contact data - replace with actual contact lookup
  const contact = phoneNumber ? findContactByPhoneNumber(phoneNumber) : null

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatCallDuration = () => {
    const minutes = Math.floor(callDuration / 60)
    const seconds = callDuration % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  // Initialize WebSocket connection for real-time call updates
  useEffect(() => {
    if (isDemo) return

    // Connect to WebSocket for real-time updates
    const ws = new WebSocket("wss://voip.stormcdn.net/observer-stream")
    wsRef.current = ws

    ws.onopen = () => {
      console.log("WebSocket connection established")
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Handle transcript updates
        if (data.event === "user_transcript" && data.user_transcription_event?.user_transcript) {
          setTranscript((prev) => [...prev, data.user_transcription_event.user_transcript])
        }

        // Handle call status updates
        if (data.event === "status" && data.callSid === callSid) {
          setCallStatus(data.status)

          if (data.status === "completed" || data.status === "failed") {
            endCallCleanup()
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    ws.onclose = () => {
      console.log("WebSocket connection closed")
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [callSid, isDemo])

  // Start call duration timer
  useEffect(() => {
    if (isDemo) {
      // For demo, just increment the timer
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
      return
    }

    // Only start timer when call is in progress
    if (callStatus === "in-progress") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [callStatus, isDemo])

  // Poll for call status updates
  useEffect(() => {
    if (isDemo) return

    const checkCallStatus = async () => {
      try {
        const response = await fetch(`/api/calls?callSid=${callSid}&userId=${user?.uid}`)

        if (!response.ok) {
          throw new Error("Failed to fetch call status")
        }

        const data = await response.json()
        setCallStatus(data.status)

        if (data.status === "completed" || data.status === "failed") {
          endCallCleanup()
        }
      } catch (error) {
        console.error("Error checking call status:", error)
      }
    }

    // Check status every 5 seconds
    const statusInterval = setInterval(checkCallStatus, 5000)

    return () => {
      clearInterval(statusInterval)
    }
  }, [callSid, user, isDemo])

  // Clean up when call ends
  const endCallCleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (onCallEnded) {
      onCallEnded(transcript)
    }

    // Save transcript if not a demo
    if (!isDemo && transcript.length > 0) {
      saveTranscript()
    }
  }

  // Save transcript to database
  const saveTranscript = async () => {
    if (!user) return

    try {
      await fetch("/api/calls/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          callSid,
          transcript,
          contactName,
          phoneNumber,
        }),
      })
    } catch (error) {
      console.error("Error saving transcript:", error)
    }
  }

  // Handle ending the call
  const handleEndCall = async () => {
    if (isDemo) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (onCallEnded) {
        onCallEnded(["This is a demo call transcript."])
      }
      // Clear session storage for demo calls too
      sessionStorage.removeItem("activeCall")
      sessionStorage.removeItem("activeCallChatId")
      return
    }

    try {
      await fetch("/api/calls/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.uid,
          callSid,
        }),
      })

      setCallStatus("completed")
      endCallCleanup()
      // Clear session storage
      sessionStorage.removeItem("activeCall")
      sessionStorage.removeItem("activeCallChatId")
    } catch (error) {
      console.error("Error ending call:", error)
    }
  }

  // Handle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted)
    // In a real implementation, this would send a command to mute the call
  }

  // Handle speaker on/off
  // const toggleSpeaker = () => {
  //   setIsSpeakerOn(!isSpeakerOn)
  //   // In a real implementation, this would toggle the speaker
  // }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return ""
    return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
  }

  // Replace the useEffect hook that creates the toast with this improved version
  // This should be placed where the current toast useEffect is

  useEffect(() => {
    console.log("Call status changed:", callStatus)

    // Store call data in session storage for persistence
    if (!isDemo) {
      const callData = {
        callSid,
        phoneNumber,
        contactName,
        callStatus,
      }
      sessionStorage.setItem("activeCall", JSON.stringify(callData))

      // Store the current chat ID if available from URL
      const urlParams = new URLSearchParams(window.location.search)
      const chatId = urlParams.get("chat")
      if (chatId) {
        sessionStorage.setItem("activeCallChatId", chatId)
      }
    }

    // Create a unique ID for this call toast to prevent duplicates
    const toastId = `call-${callSid}`

    // Show the toast notification
    const { dismiss } = toast({
      id: toastId,
      description: (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 p-4 shadow-lg w-[350px] max-w-full overflow-hidden">
          {/* Call status and duration */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200" data-call-status>
              {callStatus === "in-progress" ? "Connected" : callStatus}
            </span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400" data-call-duration>
              {formatCallDuration()}
            </span>
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-3 mb-4">
            {contact?.profilePic ? (
              <img
                src={contact.profilePic || "/placeholder.svg"}
                alt={contact.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : contactName ? (
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-lg font-medium">{getInitials(contactName)}</span>
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <User className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              {contactName && (
                <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{contactName}</div>
              )}
              <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                {formatPhoneNumber(phoneNumber) || "Unknown number"}
              </div>
            </div>
          </div>

          {/* Call controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 rounded-full border-red-500 hover:bg-red-500/10"
              onClick={() => {
                handleEndCall()
                dismiss()
              }}
            >
              <PhoneOff className="h-4 w-4 text-red-500" />
              <span className="sr-only">End Call</span>
            </Button>

            <Button
              size="icon"
              variant="outline"
              className={cn(
                "h-10 w-10 rounded-full",
                !isMuted ? "border-primary bg-white dark:bg-zinc-800" : "border-zinc-300 dark:border-zinc-700",
              )}
              onClick={toggleMute}
            >
              {!isMuted ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              )}
              <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 rounded-full border-primary hover:bg-primary/10"
              onClick={() => {
                // Navigate back to the chat
                const chatId = sessionStorage.getItem("activeCallChatId")
                if (chatId) {
                  window.location.href = `/assistant?chat=${chatId}`
                } else {
                  window.location.href = "/assistant"
                }
              }}
            >
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="sr-only">Return to Chat</span>
            </Button>
          </div>
        </div>
      ),
      duration: Number.POSITIVE_INFINITY, // Toast stays until call ends
      className: "call-toast-container",
    })

    // Clean up toast and session storage when call ends or component unmounts
    return () => {
      if (callStatus === "completed" || callStatus === "failed") {
        if (dismiss) dismiss()
        sessionStorage.removeItem("activeCall")
        sessionStorage.removeItem("activeCallChatId")
      }
    }
    // Only create the toast once when the component mounts, then update it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callSid])

  // Update toast content when call status or duration changes
  useEffect(() => {
    // Update the toast content without recreating it
    const toastElement = document.querySelector(`[data-toast-id="call-${callSid}"]`)

    if (toastElement) {
      // Update call status text
      const statusElement = toastElement.querySelector("[data-call-status]")
      if (statusElement) {
        statusElement.textContent = callStatus === "in-progress" ? "Connected" : callStatus
      }

      // Update call duration text
      const durationElement = toastElement.querySelector("[data-call-duration]")
      if (durationElement) {
        durationElement.textContent = formatCallDuration()
      }
    }
  }, [callStatus, callDuration, callSid])

  // Don't render anything in the chat window
  return null
}

