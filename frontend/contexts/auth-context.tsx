"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged } from "firebase/auth"
import { auth, getUserData } from "@/lib/firebase"
import { useRouter } from "next/navigation"

type UserData = {
  userId: string
  firstName: string
  lastName: string
  email: string
  starlisForwardingEmail: string
  smtpUsername: string
  smtpPassword: string
  smtpPort: string
  smtpServer: string
  smtpEncryption: string
  twoFactorEnabled: boolean
  integrations: {
    googleCalendar: boolean
    outlookCalendar: boolean
    appleCalendar: boolean
    gmail: boolean
    discord: boolean
    twitter: boolean
  }
  onboarding?: {
    emailSetupComplete: boolean
    integrationsSetupComplete: boolean
    voiceSetupComplete: boolean
    onboardingComplete: boolean
    integrations: {
      googleCalendar: boolean
      outlookCalendar: boolean
    }
    voice: {
      twilioSid: string
      twilioApiKey: string
      twilioPhoneNumber: string
      elevenLabsApiKey: string
      elevenLabsAgentId: string
    }
  }
  calendar?: {
    defaultMeetingDuration: string
    bufferTime: string
    workingHours: {
      start: string
      end: string
    }
    workingDays: string[]
    autoAcceptMeetings: boolean
  }
  handling?: {
    autoReplyToEmails: boolean
    autoScheduleMeetings: boolean
    autoSuggestTimes: boolean
    confirmBeforeSending: boolean
    emailResponseStyle: string
    emailResponseMode: string
    allowCallForwarding: boolean
    requireCallConfirmation: boolean
    startupPage: string
  }
  voice?: {
    twilioSid: string
    twilioApiKey: string
    twilioPhoneNumber: string
    elevenLabsApiKey: string
    elevenLabsAgentId: string
  }
  assistant?: {
    name: string
    systemPrompt: string
    temperature: string
    voice?: {
      id: string
      stability: string
      clarity: string
      enabled: boolean
    }
  }
  phoneNumber?: string
  emailVerified?: boolean
  phoneVerified?: boolean
}

type AuthContextType = {
  user: User | null
  userData: UserData | null
  loading: boolean
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUserData = async () => {
    if (user) {
      try {
        const data = (await getUserData(user.uid)) as UserData
        setUserData(data)
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          const data = (await getUserData(currentUser.uid)) as UserData
          setUserData(data)
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>{children}</AuthContext.Provider>
}

