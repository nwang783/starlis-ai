import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"

// GET endpoint to get call transcript
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const callSid = searchParams.get("callSid")

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    // Make a request to the external transcript service
    const response = await fetch(`https://voip.stormcdn.net/transcript/${callSid}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error getting call transcript:", error)
    return NextResponse.json({ error: error.message || "Failed to get call transcript" }, { status: 500 })
  }
}

// POST endpoint to save call transcript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, callSid, transcript, contactName, phoneNumber } = body

    if (!userId || !callSid || !transcript) {
      return NextResponse.json({ error: "User ID, Call SID, and transcript are required" }, { status: 400 })
    }

    // Save transcript to Firestore
    const callRef = collection(db, "users", userId, "calls")
    await addDoc(callRef, {
      callSid,
      transcript,
      contactName: contactName || phoneNumber,
      phoneNumber,
      timestamp: new Date().toISOString(),
      userId,
    })

    return NextResponse.json({
      success: true,
      message: "Transcript saved successfully",
    })
  } catch (error: any) {
    console.error("Error saving call transcript:", error)
    return NextResponse.json({ error: error.message || "Failed to save call transcript" }, { status: 500 })
  }
}

