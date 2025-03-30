// Utility function to get the OpenAI API key
export function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined in environment variables")
  }

  return apiKey
}

