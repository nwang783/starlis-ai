import { OpenAI } from "openai"
import { NextResponse } from "next/server"
import { extractPhoneNumber } from "@/lib/utils"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { processMessageWithClaude } from "@/lib/server/anthropic-service"

// Initialize OpenAI client (server-side only)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use server-side env variable
})

export async function POST(req: Request) {
  try {
    const { userId, content, messages, model = "gpt-4" } = await req.json()

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

    // If no call intent or no valid phone number found, proceed with AI chat
    const allMessages: ChatCompletionMessageParam[] = messages.map((msg: any) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }))

    allMessages.push({
      role: "user",
      content,
    })

    let aiResponse: string

    // Handle different AI models
    if (model.startsWith("claude")) {
      aiResponse = await processMessageWithClaude(allMessages, model as "claude-3-sonnet" | "claude-3-haiku")
    } else {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: allMessages,
        temperature: 0.7,
      })
      aiResponse = completion.choices[0].message.content || ""
    }

    return NextResponse.json({
      message: {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error processing message:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}

