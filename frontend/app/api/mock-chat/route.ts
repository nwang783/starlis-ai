import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("API route /api/mock-chat called (fallback)")

  try {
    // Parse request body
    const body = await request.json()
    const { content } = body

    // Generate a mock response
    const mockResponse = getMockResponse(content)

    return NextResponse.json({
      message: {
        role: "assistant",
        content: mockResponse,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Error in mock-chat API route:", error)

    return NextResponse.json({
      message: {
        role: "assistant",
        content: "I apologize, but I encountered an error. How else can I assist you?",
        timestamp: new Date().toISOString(),
      },
    })
  }
}

// Generate a mock response based on the input
function getMockResponse(message: string): string {
  // Simple keyword-based response generation
  if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
    return "Hello! How can I assist you today?"
  } else if (message.toLowerCase().includes("help")) {
    return "I'm here to help. What do you need assistance with?"
  } else if (message.toLowerCase().includes("thanks") || message.toLowerCase().includes("thank you")) {
    return "You're welcome! Is there anything else I can help with?"
  } else if (message.toLowerCase().includes("weather")) {
    return "I'm sorry, I don't have access to real-time weather data right now."
  } else if (message.toLowerCase().includes("meeting") || message.toLowerCase().includes("schedule")) {
    return "I'd be happy to help you schedule a meeting. What date and time works for you?"
  } else if (message.toLowerCase().includes("email") || message.toLowerCase().includes("mail")) {
    return "I can help you draft an email. Who would you like to send it to?"
  } else if (message.toLowerCase().includes("call") || message.toLowerCase().includes("phone")) {
    return "I can help you make a call. Who would you like to call?"
  } else {
    return "I understand your message. How can I assist you further with this?"
  }
}

