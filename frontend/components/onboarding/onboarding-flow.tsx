"use client"

import { useState } from "react"
import { VerificationStep } from "./step1-verification-step"
import { Step1EmailSetup } from "./step2-email"
import { Step2Integrations } from "./step3-integrations"
import { Step3VoiceSetup } from "./step4-voice"
import { Step4Completion } from "./step5-completion"
import { OnboardingProgress } from "./onboarding-progress"

interface OnboardingFlowProps {
  userId: string
  userEmail: string
  userPhone: string
}

export function OnboardingFlow({ userId, userEmail, userPhone }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isVerified, setIsVerified] = useState<boolean>(false)

  // State for each step's data
  const [emailData, setEmailData] = useState({ starlisEmail: `${userEmail.split("@")[0]}.starlis@starlis.com` })
  const [integrationsData, setIntegrationsData] = useState({ googleCalendar: false, outlookCalendar: false })
  const [voiceData, setVoiceData] = useState({
    twilioSid: "",
    twilioApiKey: "",
    twilioPhoneNumber: "",
    elevenLabsApiKey: "",
    elevenLabsAgentId: "",
  })

  const handleVerificationComplete = () => {
    setIsVerified(true)
    setCurrentStep(2)
  }

  const handleNext = (data: any) => {
    if (currentStep < 5) {
      // Save step data
      if (currentStep === 2) {
        setEmailData(data)
      } else if (currentStep === 3) {
        setIntegrationsData(data)
      } else if (currentStep === 4) {
        setVoiceData(data)
      }

      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // Save all data and redirect to dashboard
    window.location.href = "/dashboard"
  }

  // Render the appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <VerificationStep
            email={userEmail || "user@example.com"}
            phoneNumber={userPhone || "+1234567890"}
            onNext={handleVerificationComplete}
          />
        )
      case 2:
        return <Step1EmailSetup starlisEmail={emailData.starlisEmail} onNext={handleNext} />
      case 3:
        return <Step2Integrations integrations={integrationsData} onNext={handleNext} onBack={handleBack} />
      case 4:
        return <Step3VoiceSetup voiceSettings={voiceData} onNext={handleNext} onBack={handleBack} />
      case 5:
        return <Step4Completion onComplete={handleComplete} onBack={handleBack} />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <OnboardingProgress currentStep={currentStep} />
      <div className="mt-8">{renderStep()}</div>
    </div>
  )
}

