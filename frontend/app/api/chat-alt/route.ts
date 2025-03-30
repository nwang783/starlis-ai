import { type NextRequest, NextResponse } from "next/server"
import { extractPhoneNumber } from "@/lib/utils"

// Use the Edge Runtime to ensure this runs on the server
export const runtime = "edge"

export async function POST(request: NextRequest) {
  console.log("API route /api/chat-alt called")

  try {
    // Parse request body
    const body = await request.json()
    const { userId, content, messages } = body

    // Validate required fields
    if (!userId || !content) {
      return NextResponse.json({ error: "User ID and content are required" }, { status: 400 })
    }

    // Check if the message contains a call intent
    const callIntent =
      content.toLowerCase().includes("call") ||
      content.toLowerCase().includes("dial") ||
      content.toLowerCase().includes("phone")

    if (callIntent) {
      // Extract phone number from the message
      const phoneNumber = extractPhoneNumber(content)

      // Extract name if present (simple heuristic)
      let name = null
      if (phoneNumber) {
        const beforePhone = content.substring(0, content.indexOf(phoneNumber)).toLowerCase()
        if (beforePhone.includes("call")) {
          const nameMatch = beforePhone.match(/call\s+([a-z\s]+?)(?=\s+at|\s+on|\s+\d|$)/i)
          if (nameMatch && nameMatch[1]) {
            name = nameMatch[1].trim()
          }
        }
      }

      if (phoneNumber) {
        console.log("Call intent detected, returning call action")
        return NextResponse.json({
          message: {
            role: "assistant",
            content: `I'll help you place a call to ${name || phoneNumber}...`,
            timestamp: new Date().toISOString(),
          },
          action: {
            type: "call",
            phoneNumber,
            contactName: name,
          },
        })
      }
    }

    // Instead of calling OpenAI, just return a simple response
    // This route is only used as a fallback, so we can provide a simple message
    console.log("Returning alternate response without calling OpenAI")
    
    return NextResponse.json({
      message: {
        role: "assistant",
        content: "I'm sorry, but I'm currently experiencing connectivity issues with my primary system. I'll have limited functionality until the connection is restored. How can I assist you with basic information?",
        timestamp: new Date().toISOString(),
      },
    })
    
  } catch (error: any) {
    console.error("Unhandled error in chat-alt API route:", error.message)

    return NextResponse.json({
      message: {
        role: "assistant",
        content: "I apologize, but I encountered an unexpected error. Please try again with your question.",
        timestamp: new Date().toISOString(),
      },
    })
  }
}

