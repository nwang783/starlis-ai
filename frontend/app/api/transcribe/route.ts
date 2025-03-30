import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("file") as File

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    // Convert File to Blob for OpenAI API
    const buffer = await audioFile.arrayBuffer()
    const blob = new Blob([buffer])

    const transcription = await openai.audio.transcriptions.create({
      file: blob,
      model: "whisper-1",
    })

    return NextResponse.json({
      text: transcription.text,
    })
  } catch (error) {
    console.error("Error in transcription API route:", error)
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}

