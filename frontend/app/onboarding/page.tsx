"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Step1EmailSetup } from "@/components/onboarding/step2-email"
import { Step3ExternalIntegrations } from "@/components/onboarding/step3-external-integrations"
import { Step3VoiceSetup } from "@/components/onboarding/step4-voice"
import { Step4Completion } from "@/components/onboarding/step5-completion"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import { updateUserData } from "@/lib/firebase"
import { Loader2 } from "lucide-react"
import { VerificationStep } from "@/components/onboarding/step1-verification-step"
import { LogoIcon } from "@/components/logo-icon"

export default function OnboardingPage() {
  const { user, userData, refreshUserData } = useAuth()
  const router = useRouter()

  // Add verification state
  const [isVerified, setIsVerified] = useState(false)

  // Update the currentStep state initialization
  const [currentStep, setCurrentStep] = useState(1) // Start at step 1 (Verification)

  const [isLoading, setIsLoading] = useState(true)
  const [onboardingData, setOnboardingData] = useState({
    emailSetupComplete: false,
    integrationsSetupComplete: false,
    voiceSetupComplete: false,
    onboardingComplete: false,
    integrations: {
      googleCalendar: false,
      outlookCalendar: false,
    },
    voice: {
      twilioSid: "",
      twilioApiKey: "",
      twilioPhoneNumber: "",
      elevenLabsApiKey: "",
      elevenLabsAgentId: "",
    },
  })

  // Load onboarding data from user profile
  useEffect(() => {
    const loadOnboardingData = async () => {
      if (!user || !userData) return

      setIsLoading(true)

      try {
        // If user has onboarding data, load it
        if (userData.onboarding) {
          setOnboardingData(userData.onboarding)

          // If onboarding is already complete, redirect to dashboard
          if (userData.onboarding.onboardingComplete) {
            router.push("/dashboard")
            return
          }
        }
      } catch (error) {
        console.error("Error loading onboarding data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOnboardingData()
  }, [user, userData, router])

  useEffect(() => {
    if (!userData) return

    // Check if user has already verified email and phone
    if (userData?.emailVerified && userData?.phoneVerified) {
      setIsVerified(true)
    } else {
      setIsVerified(false)
    }

    // Set the current step based on verification and onboarding data
    if (userData?.emailVerified && userData?.phoneVerified) {
      if (userData?.onboarding?.voiceSetupComplete) {
        setCurrentStep(5) // Set to completion step if voice setup is complete
      } else if (userData?.onboarding?.integrationsSetupComplete) {
        setCurrentStep(4) // Voice setup step
      } else if (userData?.onboarding?.emailSetupComplete) {
        setCurrentStep(3) // Integrations step
      } else {
        setCurrentStep(2) // Email forwarding step
      }
    } else {
      setCurrentStep(1) // Verification step
    }
  }, [userData])

  // Add a debug output to help diagnose the issue
  console.log("Current step in page component:", currentStep)

  const handleNext = async (stepData: any) => {
    if (!user) return

    setIsLoading(true)

    try {
      // Update the onboarding data with the new step data
      const updatedOnboardingData = {
        ...onboardingData,
        ...stepData,
      }

      // Save to Firebase
      await updateUserData(user.uid, {
        onboarding: updatedOnboardingData,
      })

      // Update local state
      setOnboardingData(updatedOnboardingData)

      // Move to next step
      setCurrentStep((prev) => prev + 1)
      console.log("Moving to next step:", currentStep + 1)

      // Refresh user data
      await refreshUserData()
    } catch (error) {
      console.error("Error saving onboarding data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleComplete = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Mark onboarding as complete
      const finalOnboardingData = {
        ...onboardingData,
        onboardingComplete: true,
      }

      // Save to Firebase
      await updateUserData(user.uid, {
        onboarding: finalOnboardingData,
      })

      // Refresh user data
      await refreshUserData()

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error completing onboarding:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Update the return statement to include the verification step
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8" />
            <span className="font-bold text-xl">starlis.ai</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container max-w-5xl py-8 px-4">
          <OnboardingProgress currentStep={currentStep} />

          <div className="mt-8">
            {!isVerified ? (
              <VerificationStep
                email={userData?.email || ""}
                phoneNumber={userData?.phoneNumber || ""}
                refreshUserData={refreshUserData}
                onNext={() => {
                  setIsVerified(true)
                  setCurrentStep(2) // Move to step 2 after verification
                }}
              />
            ) : (
              <>
                {currentStep === 2 && (
                  <Step1EmailSetup
                    starlisEmail={userData?.starlisForwardingEmail || ""}
                    onNext={(data) => handleNext({ emailSetupComplete: true })}
                  />
                )}

                {currentStep === 3 && (
                  <Step3ExternalIntegrations
                    integrations={onboardingData.integrations}
                    onNext={(data) =>
                      handleNext({
                        integrationsSetupComplete: true,
                        integrations: data,
                      })
                    }
                    onBack={handleBack}
                  />
                )}

                {currentStep === 4 && (
                  <Step3VoiceSetup
                    voiceSettings={onboardingData.voice}
                    onNext={(data) =>
                      handleNext({
                        voiceSetupComplete: true,
                        voice: data,
                      })
                    }
                    onBack={handleBack}
                  />
                )}

                {currentStep === 5 && <Step4Completion onComplete={handleComplete} onBack={handleBack} />}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

