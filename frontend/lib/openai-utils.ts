/**
 * Utility functions for OpenAI integration
 */

// Check if OpenAI API key is valid
export async function checkOpenAIApiKey(): Promise<boolean> {
  try {
    const response = await fetch("/api/test-openai")
    const data = await response.json()

    return data.status === "success"
  } catch (error) {
    console.error("Error checking OpenAI API key:", error)
    return false
  }
}

// Get a fallback response when OpenAI is not available
export function getFallbackResponse(message: string): string {
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

