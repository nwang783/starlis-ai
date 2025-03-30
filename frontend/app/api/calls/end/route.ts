import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// Function to get user's Twilio credentials from Firestore
async function getUserCredentials(userId: string) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    const userData = userDoc.data()

    // Get Twilio credentials from user data
    const twilioSid = userData.voice?.twilioSid || userData.onboarding?.voice?.twilioSid
    const twilioApiKey = userData.voice?.twilioApiKey || userData.onboarding?.voice?.twilioApiKey

    if (!twilioSid || !twilioApiKey) {
      throw new Error("Twilio credentials not found")
    }

    return {
      twilioSid,
      twilioApiKey,
    }
  } catch (error) {
    console.error("Error getting user credentials:", error)
    throw error
  }
}

// POST endpoint to end a call
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, callSid } = body

    if (!userId || !callSid) {
      return NextResponse.json({ error: "User ID and Call SID are required" }, { status: 400 })
    }

    // Get user's Twilio credentials
    const credentials = await getUserCredentials(userId)

    // Initialize Twilio client
    const twilioClient = twilio(credentials.twilioSid, credentials.twilioApiKey)

    // End the call
    await twilioClient.calls(callSid).update({ status: "completed" })

    return NextResponse.json({
      success: true,
      message: "Call ended successfully",
    })
  } catch (error: any) {
    console.error("Error ending call:", error)
    return NextResponse.json({ error: error.message || "Failed to end call" }, { status: 500 })
  }
}

