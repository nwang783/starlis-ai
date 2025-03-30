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
    const twilioPhoneNumber = userData.voice?.twilioPhoneNumber || userData.onboarding?.voice?.twilioPhoneNumber
    const elevenLabsApiKey = userData.voice?.elevenLabsApiKey || userData.onboarding?.voice?.elevenLabsApiKey
    const elevenLabsAgentId = userData.voice?.elevenLabsAgentId || userData.onboarding?.voice?.elevenLabsAgentId

    if (!twilioSid || !twilioApiKey || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not found")
    }

    return {
      twilioSid,
      twilioApiKey,
      twilioPhoneNumber,
      elevenLabsApiKey,
      elevenLabsAgentId,
    }
  } catch (error) {
    console.error("Error getting user credentials:", error)
    throw error
  }
}

// POST endpoint to initiate a call
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, phoneNumber, name } = body

    if (!userId || !phoneNumber) {
      return NextResponse.json({ error: "User ID and phone number are required" }, { status: 400 })
    }

    // Get user's Twilio credentials
    const credentials = await getUserCredentials(userId)

    // Initialize Twilio client
    const twilioClient = twilio(credentials.twilioSid, credentials.twilioApiKey)

    // Prepare TwiML for the call
    const twiml = new twilio.twiml.VoiceResponse()
    twiml.connect().stream({
      url: "wss://voip.stormcdn.net/outbound-media-stream",
    })

    // Make the call
    const call = await twilioClient.calls.create({
      twiml: twiml.toString(),
      to: phoneNumber,
      from: credentials.twilioPhoneNumber,
      statusCallback: "https://voip.stormcdn.net/call-status",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
    })

    // Return call details
    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      name: name || phoneNumber,
      phoneNumber,
      startTime: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error initiating call:", error)
    return NextResponse.json({ error: error.message || "Failed to initiate call" }, { status: 500 })
  }
}

// GET endpoint to get call status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const callSid = searchParams.get("callSid")
    const userId = searchParams.get("userId")

    if (!callSid || !userId) {
      return NextResponse.json({ error: "Call SID and User ID are required" }, { status: 400 })
    }

    // Get user's Twilio credentials
    const credentials = await getUserCredentials(userId)

    // Initialize Twilio client
    const twilioClient = twilio(credentials.twilioSid, credentials.twilioApiKey)

    // Get call details
    const call = await twilioClient.calls(callSid).fetch()

    return NextResponse.json({
      callSid: call.sid,
      status: call.status,
      duration: call.duration,
      startTime: call.startTime,
      endTime: call.endTime,
    })
  } catch (error: any) {
    console.error("Error getting call status:", error)
    return NextResponse.json({ error: error.message || "Failed to get call status" }, { status: 500 })
  }
}

