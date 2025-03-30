import { type NextRequest, NextResponse } from "next/server"
import { generateAIResponse } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const response = await generateAIResponse(prompt)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in AI API route:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}

