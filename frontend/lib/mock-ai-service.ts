import type { Message, Action } from "./ai-service"

// Process a message and get a mock response
export async function processMockAIMessage(
  userId: string,
  content: string,
  messages: Message[],
): Promise<{ message: Message; action?: Action }> {
  console.log("Processing mock AI message for user:", userId)

  // Check for call intent
  const callIntent =
    content.toLowerCase().includes("call") ||
    content.toLowerCase().includes("dial") ||
    content.toLowerCase().includes("phone")

  if (callIntent) {
    // Simple regex to extract something that looks like a phone number
    const phoneMatch = content.match(/(\d{3}[-.\s]??\d{3}[-.\s]??\d{4}|$$\d{3}$$\s*\d{3}[-.\s]??\d{4}|\d{10})/g)
    const phoneNumber = phoneMatch ? phoneMatch[0] : null

    // Extract name using simple heuristic
    let name = null
    if (phoneNumber) {
      const beforePhone = content.substring(0, content.indexOf(phoneNumber)).toLowerCase()
      if (beforePhone.includes("call")) {
        const nameMatch = beforePhone.match(/call\s+([a-z]+)/i)
        if (nameMatch && nameMatch[1]) {
          name = nameMatch[1]
        }
      }
    }

    if (phoneNumber) {
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

  // Generate a mock response based on the content
  const mockResponse = getMockResponse(content)

  return {
    message: {
      role: "assistant",
      content: mockResponse,
      timestamp: new Date().toISOString(),
    },
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
  } else {
    return "I understand your message. How can I assist you further with this?"
  }
}

