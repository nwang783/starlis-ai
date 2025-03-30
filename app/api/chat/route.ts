import { OpenAI } from "openai"
import { NextResponse } from "next/server"
import { extractPhoneNumber } from "@/lib/utils"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

// Initialize OpenAI client (server-side only)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use server-side env variable
})

export async function POST(req: Request) {
  try {
    const { userId, content, messages } = await req.json()

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

    // If no call intent or no valid phone number found, proceed with normal OpenAI chat
    const allMessages: ChatCompletionMessageParam[] = messages.map((msg: any) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }))

    allMessages.push({
      role: "user",
      content,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: allMessages,
      temperature: 0.7,
    })

    return NextResponse.json({
      message: {
        role: "assistant",
        content: completion.choices[0].message.content || "",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error processing message:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}

