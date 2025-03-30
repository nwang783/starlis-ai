import { useAuth } from "@/contexts/auth-context"

const API_BASE_URL = "https://voip.starlis.tech"

export interface CallStatus {
  success: boolean
  callSid: string
  status: "queued" | "ringing" | "in-progress" | "completed" | "failed" | "busy" | "no-answer"
  startTime: string
  endTime: string | null
  duration: number
}

export interface CallResponse {
  success: boolean
  message: string
  callSid: string
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json()
      throw new Error(error.error || "API request failed")
    } else {
      throw new Error(`API request failed with status ${response.status}`)
    }
  }

  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Invalid response format from server")
  }

  return response.json()
}

export async function initiateCall(
  userId: string,
  number: string,
  prompt: string,
  first_message: string
): Promise<CallResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/outbound-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        number,
        prompt,
        first_message,
      }),
    })

    return handleResponse(response)
  } catch (error) {
    console.error("Error initiating call:", error)
    throw new Error("Failed to initiate call. Please try again later.")
  }
}

export async function endCall(userId: string, callSid: string): Promise<CallResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/end-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        callSid,
        user_id: userId,
      }),
    })

    return handleResponse(response)
  } catch (error) {
    console.error("Error ending call:", error)
    throw new Error("Failed to end call. Please try again later.")
  }
}

export async function getCallStatus(userId: string, callSid: string): Promise<CallStatus> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/call-status?callSid=${callSid}&user_id=${userId}`
    )

    return handleResponse(response)
  } catch (error) {
    console.error("Error getting call status:", error)
    throw new Error("Failed to get call status. Please try again later.")
  }
}

export function createCallWebSocket(userId: string, callSid: string): WebSocket {
  const ws = new WebSocket(
    `${API_BASE_URL.replace("https", "wss")}/frontend-stream?callSid=${callSid}&user_id=${userId}`
  )

  // Send connect-twilio event when connection is established
  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        event: "connect-twilio",
        callSid,
        user_id: userId,
      })
    )
  }

  return ws
} 