/// Client-side service for interacting with the AI API
// This file does NOT directly use the OpenAI client

import { extractPhoneNumber } from "./utils"

// Define the message type
export type Message = {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
}

// Define the action type
export type Action = {
  type: string
  [key: string]: any
}

// Process a message and get a response
export async function processAIMessage(
  userId: string,
  content: string,
  messages: Message[],
  model: string 
): Promise<{ message: Message; action?: Action }> {
  console.log("Processing AI message for user:", userId)

  // Validate inputs
  if (!userId) {
    console.error("Missing userId in processAIMessage")
    return {
      message: {
        role: "assistant",
        content: "I'm sorry, there was an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      },
    }
  }

  console.log("User ID:", userId)

  if (!content) {
    console.error("Missing content in processAIMessage")
    return {
      message: {
        role: "assistant",
        content: "I'm sorry, I didn't receive any message to process. Please try again.",
        timestamp: new Date().toISOString(),
      },
    }
  }

  // Check for call intent on the client side as well
  const contentLower = typeof content === "string" ? content.toLowerCase() : ""
  const callIntent = contentLower.includes("call") || contentLower.includes("dial") || contentLower.includes("phone")

  if (callIntent) {
    const phoneNumber = extractPhoneNumber(content)

    if (phoneNumber) {
      console.log("Call intent detected on client side, extracting phone number:", phoneNumber)

      // Extract name if present (simple heuristic)
      let name = null
      const beforePhone = content.substring(0, content.indexOf(phoneNumber)).toLowerCase()
      if (beforePhone.includes("call")) {
        const nameMatch = beforePhone.match(/call\s+([a-z\s]+?)(?=\s+at|\s+on|\s+\d|$)/i)
        if (nameMatch && nameMatch[1]) {
          name = nameMatch[1].trim()
        }
      }

      return {
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
      }
    }
  }

  // Ensure messages is an array
  const validMessages = Array.isArray(messages) ? messages : []

  // Try the main API endpoint first
  try {
    console.log("Trying main API endpoint")
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        content,
        messages: validMessages,
        model,
      }),
    })

    if (!response.ok) {
      console.error("API response not OK:", response.status, await response.text())
      throw new Error(`API response not OK: ${response.status}`)
    }

    const data = await response.json()
    console.log("Main API response received")
    return data
  } catch (error) {
    console.error("Error with main API endpoint:", error)

    // Try the mock API endpoint as a fallback
    try {
      console.log("Trying mock API endpoint")
      const mockResponse = await fetch("/api/mock-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          content,
          messages: validMessages,
          model,
        }),
      })

      if (!mockResponse.ok) {
        throw new Error(`Mock API response not OK: ${mockResponse.status}`)
      }

      const mockData = await mockResponse.json()
      console.log("Mock API response received")
      return mockData
    } catch (mockError) {
      console.error("All API endpoints failed:", mockError)

      // Return a fallback response
      return {
        message: {
          role: "assistant",
          content: getFallbackResponse(content),
          timestamp: new Date().toISOString(),
        },
      }
    }
  }
}

// Generate AI response based on prompt
export async function generateAIResponse(
  prompt: string, 
  userId: string = "default-user", // Add userId parameter with default value
  model: string = "gpt-4"
): Promise<any> {
  try {
    // Pass the actual userId to processAIMessage
    console.log("Generating AI response for user:", userId)
    return await processAIMessage(userId, prompt, [], model)
  } catch (error) {
    console.error("Error generating AI response:", error)
    return {
      message: {
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request.",
        timestamp: new Date().toISOString(),
      },
    }
  }
}

// Fallback response function
function getFallbackResponse(message: string): string {
  // Simple keyword-based response generation
  const messageLower = message.toLowerCase()
  if (messageLower.includes("hello") || messageLower.includes("hi")) {
    return "Hello! How can I assist you today?"
  } else if (messageLower.includes("help")) {
    return "I'm here to help. What do you need assistance with?"
  } else if (messageLower.includes("thanks") || messageLower.includes("thank you")) {
    return "You're welcome! Is there anything else I can help with?"
  } else if (messageLower.includes("weather")) {
    return "I'm sorry, I don't have access to real-time weather data right now."
  } else if (messageLower.includes("meeting") || messageLower.includes("schedule")) {
    return "I'd be happy to help you schedule a meeting. What date and time works for you?"
  } else if (messageLower.includes("email") || messageLower.includes("mail")) {
    return "I can help you draft an email. Who would you like to send it to?"
  } else {
    return "I understand your message. How can I assist you further with this?"
  }
}

