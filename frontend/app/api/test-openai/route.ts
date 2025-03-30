import { NextResponse } from "next/server"
import OpenAI from "openai"

// Use the Edge Runtime to ensure this runs on the server
export const runtime = "edge"

export async function GET() {
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          status: "error",
          message: "OPENAI_API_KEY is not set",
        },
        { status: 500 },
      )
    }

    try {
      // Create a new OpenAI instance with dangerouslyAllowBrowser set to true
      // This is safe because we're using the Edge Runtime which runs on the server
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true, // This is safe in Edge Runtime
      })

      // Test the OpenAI API with a simple message
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello, are you working?" }],
        temperature: 0.7,
      })

      const response = completion.choices[0].message.content || ""

      return NextResponse.json({
        status: "success",
        message: "OpenAI service is working",
        response: response.substring(0, 50) + "...", // Just return the first 50 chars
      })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      return NextResponse.json(
        {
          status: "error",
          message: openaiError.message || "Unknown OpenAI error",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Unhandled error in test-openai API route:", error)

    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

