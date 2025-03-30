"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Clock, 
  MessageSquare, 
  Settings2,
  Activity
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewCallModal } from "@/components/new-call-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { initiateCall, endCall, getCallStatus, createCallWebSocket, type CallStatus } from "@/lib/firebase/calls"
import { useToast } from "@/components/ui/use-toast"

export default function CallPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get("number")
  const prompt = searchParams.get("prompt")
  const first_message = searchParams.get("first_message")
  const [showNewCallModal, setShowNewCallModal] = useState(false)
  const [callStatus, setCallStatus] = useState<CallStatus["status"]>("queued")
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [latency, setLatency] = useState<number>(0)
  const [transcriptions, setTranscriptions] = useState<Array<{ speaker: "AI" | "Human", text: string }>>([])
  const [callSid, setCallSid] = useState<string | null>(null)
  const [isEnding, setIsEnding] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize call when component mounts
  useEffect(() => {
    const startCall = async () => {
      if (!user || !phoneNumber || !prompt || !first_message || hasInitialized || isEnding) {
        return
      }

      try {
        setHasInitialized(true)
        const response = await initiateCall(user.uid, phoneNumber, prompt, first_message)
        setCallSid(response.callSid)
        
        // Start WebSocket connection
        const ws = createCallWebSocket(user.uid, response.callSid)
        wsRef.current = ws

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          
          switch (data.event) {
            case "transcription":
              setTranscriptions(prev => [...prev, { speaker: "Human", text: data.text }])
              break
            case "audio":
              // TODO: Handle audio playback
              break
          }
        }

        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          toast({
            title: "Connection Error",
            description: "Lost connection to call service",
            variant: "destructive",
          })
        }

        ws.onclose = () => {
          // Attempt to reconnect if the call is still active
          if (callStatus === "in-progress" && !isEnding) {
            setTimeout(() => {
              if (callSid) {
                wsRef.current = createCallWebSocket(user.uid, callSid)
              }
            }, 5000)
          }
        }

        // Start status check interval
        statusCheckInterval.current = setInterval(async () => {
          if (callSid) {
            try {
              const status = await getCallStatus(user.uid, callSid)
              setCallStatus(status.status)
              setTimeElapsed(status.duration)
              
              if (status.status === "completed" || status.status === "failed") {
                setIsEnding(true)
                if (statusCheckInterval.current) {
                  clearInterval(statusCheckInterval.current)
                }
                if (wsRef.current) {
                  wsRef.current.close()
                }
                toast({
                  title: "Call Ended",
                  description: status.status === "completed" 
                    ? "The other party has ended the call" 
                    : "The call failed or was disconnected",
                })
                setTimeout(() => router.push("/calls"), 3000)
              }
            } catch (error) {
              console.error("Error checking call status:", error)
            }
          }
        }, 5000)

      } catch (error) {
        console.error("Error starting call:", error)
        toast({
          title: "Error",
          description: "Failed to start call. Please try again.",
          variant: "destructive",
        })
        setHasInitialized(false) // Reset initialization state to allow retry
      }
    }

    startCall()

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [user, phoneNumber, prompt, first_message, router, toast, isEnding, hasInitialized])

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return "text-green-500"
    if (latency < 100) return "text-yellow-500"
    return "text-red-500"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleEndCall = async () => {
    if (!user || !callSid || isEnding) return
    setIsEnding(true)

    try {
      await endCall(user.uid, callSid)
      setCallStatus("completed")
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
      toast({
        title: "Call Ended",
        description: "Call ended successfully",
      })
      setTimeout(() => router.push("/calls"), 3000)
    } catch (error) {
      console.error("Error ending call:", error)
      toast({
        title: "Error",
        description: "Failed to end call",
        variant: "destructive",
      })
    }
  }

  const handleToggleMute = () => {
    if (isEnding) return
    setIsMuted(!isMuted)
    // TODO: Implement mute logic when API is available
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="h-full p-8 overflow-y-auto">
            <div className="w-full space-y-8">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Active Call</h1>
                  <p className="text-muted-foreground mt-1">Call with {phoneNumber}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={callStatus === "in-progress" ? "default" : "secondary"}
                    className="px-4 py-1 text-base"
                  >
                    {callStatus}
                  </Badge>
                  <Button variant="outline" size="icon" disabled={isEnding}>
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Call Controls Card */}
              <Card className={`border-2 w-full ${isEnding ? "opacity-50" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-2xl font-mono font-bold">{formatTime(timeElapsed)}</span>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <span className={`text-lg font-mono font-bold ${getLatencyColor(latency)}`}>
                          {latency}ms
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {latency < 50 ? "Excellent" : latency < 100 ? "Good" : "Poor"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleToggleMute}
                        className="h-14 w-14 rounded-full"
                        disabled={isEnding}
                      >
                        {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleEndCall}
                        className="h-14 w-14 rounded-full"
                        disabled={isEnding}
                      >
                        <PhoneOff className="h-7 w-7" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
                {/* Call Stream */}
                <div className="lg:col-span-3">
                  <div className={`aspect-square bg-muted rounded-xl flex items-center justify-center ${isEnding ? "opacity-50" : ""}`}>
                    <Phone className="h-16 w-16 text-muted-foreground" />
                  </div>
                </div>

                {/* Live Transcript Card */}
                <div className="lg:col-span-9">
                  <Card className={`border-2 w-full ${isEnding ? "opacity-50" : ""}`}>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Live Transcript
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[calc(100vh-24rem)] bg-muted rounded-xl p-6 overflow-y-auto">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">AI</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">{first_message}</p>
                            </div>
                          </div>
                          {transcriptions.map((transcription, index) => (
                            <div key={index} className="flex items-start gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                transcription.speaker === "AI" ? "bg-primary/10" : "bg-secondary"
                              }`}>
                                <span className="text-sm font-medium">{transcription.speaker}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground">{transcription.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
      <NewCallModal open={showNewCallModal} onOpenChange={setShowNewCallModal} />
    </SidebarProvider>
  )
} 