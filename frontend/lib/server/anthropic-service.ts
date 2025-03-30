import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { auth } from "../firebase" 

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
  model: "claude-3-7-sonnet-latest" | "claude-3-5-haiku-latest" = "claude-3-7-sonnet-latest", 
  userId: string
): Promise<string> {
  try {
    
    // Format the request payload to match what the Cloud Run endpoint expects
    const payload = {
      data: {  // Wrap in 'data' to match the CloudFunction callable format
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model,
        userId
      }
    };
    
    console.log("Sending request to Cloud Run:", JSON.stringify(payload));
    
    // Call the Cloud Run endpoint
    const response = await fetch("https://process-claude-message-ah27ntyoya-uc.a.run.app", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloud Run API error:", response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    // Parse the response
    const responseData = await response.json();
    console.log("Cloud Run response:", responseData);
    
    if (responseData.error) {
      console.error("Error from Claude processing:", responseData.error);
      throw new Error(responseData.error);
    }
    
    // Extract content from the expected structure
    return responseData.result?.content || responseData.content || "I'm sorry, but I couldn't process your request.";
  } catch (error) {
    console.error("Error calling Claude processing service:", error);
    
    // Fall back to a local mock response if the API call fails
    return "I'm sorry, I'm currently experiencing connectivity issues. Please try again later.";
  }
}