import { type NextRequest, NextResponse } from "next/server"
import { extractPhoneNumber } from "@/lib/utils"
import OpenAI from "openai"

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

    // Format messages for OpenAI
    const formattedMessages = Array.isArray(messages)
      ? messages.map((msg: any) => ({
          role: msg.role === "user" || msg.role === "assistant" || msg.role === "system" ? msg.role : "user",
          content: msg.content || "",
        }))
      : []

    // Add the new message
    formattedMessages.push({
      role: "user",
      content,
    })

    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set")
      return NextResponse.json({
        message: {
          role: "assistant",
          content:
            "I'm sorry, I'm having trouble connecting to my knowledge base right now. How else can I assist you?",
          timestamp: new Date().toISOString(),
        },
      })
    }

    try {
      // Create a new OpenAI instance with dangerouslyAllowBrowser set to true
      // This is safe because we're using the Edge Runtime which runs on the server
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true, // This is safe in Edge Runtime
      })

      console.log("Calling OpenAI API with model: gpt-4o")

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: formattedMessages,
        temperature: 0.7,
      })

      console.log("OpenAI API response received")

      return NextResponse.json({
        message: {
          role: "assistant",
          content: completion.choices[0].message.content || "",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error: any) {
      console.error("OpenAI API error:", error.message)

      // Return a fallback response
      return NextResponse.json({
        message: {
          role: "assistant",
          content: "I apologize, but I encountered an error while processing your request. Please try again later.",
          timestamp: new Date().toISOString(),
        },
      })
    }
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

