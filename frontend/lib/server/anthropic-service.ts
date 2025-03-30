import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

// Initialize Anthropic client (server-side only)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

type AnthropicMessage = {
  role: "assistant" | "user"
  content: string
}

// Process messages with Anthropic Claude
export async function processMessageWithClaude(
  messages: any[],
  model: "claude-3-7-sonnet-latest" | "claude-3-5-haiku-latest" = "claude-3-7-sonnet-latest"
): Promise<string> {
  try {
    // Convert messages to Anthropic format
    const anthropicMessages: AnthropicMessage[] = messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }))

    // Call Anthropic API
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 4096,
      messages: anthropicMessages,
      temperature: 0.7,
    })

    return message.content[0].type === "text" ? message.content[0].text : "I'm sorry, I couldn't generate a response."
  } catch (error: any) {
    console.error("Error calling Anthropic API:", error)
    throw new Error(`Anthropic API error: ${error.message}`)
  }
} 