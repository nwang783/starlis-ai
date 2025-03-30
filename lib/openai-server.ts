import OpenAI from "openai"

// This file should ONLY be imported in server components or API routes
// NEVER import this in client components

// Create and export the OpenAI client for server-side use
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to generate AI responses (server-side only)
export async function generateServerSideResponse(messages: any[]) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
    })

    return completion.choices[0].message.content || ""
  } catch (error) {
    console.error("Error generating AI response:", error)
    throw error
  }
}

