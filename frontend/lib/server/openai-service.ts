// This file should ONLY be imported from server components or API routes
// Add the "use server" directive to ensure this file is never bundled with client code
"use server"

import OpenAI from "openai"

// Create a singleton instance of the OpenAI client
let openaiInstance: OpenAI | null = null

// Function to get the OpenAI instance
function getOpenAIInstance(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set")
    }

    try {
      // Check if we're in a true server environment
      if (typeof window !== "undefined") {
        throw new Error("OpenAI client cannot be initialized in a browser environment")
      }

      openaiInstance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    } catch (error) {
      console.error("Failed to initialize OpenAI client:", error)
      throw new Error("Failed to initialize OpenAI client: " + (error instanceof Error ? error.message : String(error)))
    }
  }

  return openaiInstance
}

// Process messages with OpenAI
export async function processMessageWithOpenAI(messages: any[]): Promise<string> {
  try {
    // Get the OpenAI instance
    const openai = getOpenAIInstance()

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.7,
    })

    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response."
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error)
    throw new Error(`OpenAI API error: ${error.message}`)
  }
}

