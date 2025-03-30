import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, model } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Create system message for title generation
    const systemMessage = "You are a title generation assistant. Your task is to create short, descriptive titles (max 50 characters) for conversations. The title should be concise and reflect the main topic or purpose of the conversation. Return only the title, no additional text or explanation.";

    // Create user message
    const userMessage = `Generate a short, descriptive title for a conversation that starts with this message: "${message}". The title should be concise and reflect the main topic or purpose of the conversation. Return only the title, no additional text.`;

    // Call Claude API directly
    const response = await anthropic.messages.create({
      model: model || "claude-3-sonnet-20240229",
      max_tokens: 100,
      system: systemMessage,
      messages: [{
        role: "user",
        content: userMessage
      }]
    });

    // Extract the title from the response
    let title = "";
    for (const contentBlock of response.content) {
      if (contentBlock.type === "text") {
        title += contentBlock.text;
      }
    }

    // Clean up the title
    title = title.trim();
    title = title.replace(/["']/g, "");
    title = title.replace(/[*_`]/g, "");
    title = title.slice(0, 50);

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
} 