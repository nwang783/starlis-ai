"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExternalLink } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/**
 * This component collects voice settings during onboarding.
 * The collected data is passed to the parent component via onNext(),
 * which should save it to Firebase in the onboarding.voice path.
 * These same values are also used in the settings page under both
 * the voice and onboarding.voice paths for consistency.
 */
type VoiceSettings = {
  twilioSid: string
  twilioApiKey: string
  twilioPhoneNumber: string
  elevenLabsApiKey: string
  elevenLabsAgentId: string
}

export function Step3VoiceSetup({
  voiceSettings,
  onNext,
  onBack,
}: {
  voiceSettings: VoiceSettings
  onNext: (data: VoiceSettings) => void
  onBack: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(voiceSettings)
  const [showSkipWarning, setShowSkipWarning] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLocalSettings((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Validate Twilio fields
    if (!localSettings.twilioSid) {
      errors.twilioSid = "Twilio SID is required"
    }

    if (!localSettings.twilioApiKey) {
      errors.twilioApiKey = "Twilio API Key is required"
    }

    if (!localSettings.twilioPhoneNumber) {
      errors.twilioPhoneNumber = "Twilio Phone Number is required"
    } else if (!localSettings.twilioPhoneNumber.startsWith("+1")) {
      errors.twilioPhoneNumber = "Phone number must start with +1"
    }

    // Validate ElevenLabs fields
    if (!localSettings.elevenLabsApiKey) {
      errors.elevenLabsApiKey = "ElevenLabs API Key is required"
    }

    if (!localSettings.elevenLabsAgentId) {
      errors.elevenLabsAgentId = "ElevenLabs Agent ID is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false)
        console.log("Voice setup complete, calling onNext with:", localSettings)
        onNext(localSettings)
      }, 500)
    }
  }

  const handleSkip = () => {
    console.log("Skipping voice setup, calling onNext with:", localSettings)
    onNext(localSettings)
  }

  const isTwilioComplete =
    !!localSettings.twilioSid &&
    !!localSettings.twilioApiKey &&
    !!localSettings.twilioPhoneNumber &&
    localSettings.twilioPhoneNumber.startsWith("+1")

  const isElevenLabsComplete = !!localSettings.elevenLabsApiKey && !!localSettings.elevenLabsAgentId

  const isFormComplete = isTwilioComplete && isElevenLabsComplete

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Step 4: Set Up Voice Capabilities</CardTitle>
          <CardDescription>Configure voice services to enable phone calls and voice responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Setting up voice capabilities allows Starlis to:</p>
            <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
              <li>Make and receive phone calls on your behalf</li>
              <li>Use natural-sounding voice for responses</li>
              <li>Transcribe voice messages into text</li>
              <li>Handle voice commands and requests</li>
            </ul>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="12" fill="#F22F46" />
                      <path
                        d="M10.5 14.5L13.5 17.5L16.5 14.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7.5 9.5L10.5 6.5L13.5 9.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.5 6.5V17.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.5 17.5V10.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3 className="font-medium text-sm">Twilio Integration</h3>
                  </div>
                  {isTwilioComplete && <span className="text-xs font-medium text-green-500">Complete</span>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="twilioSid">Twilio Account SID</Label>
                    <Input
                      id="twilioSid"
                      name="twilioSid"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={localSettings.twilioSid}
                      onChange={handleInputChange}
                      className={validationErrors.twilioSid ? "border-destructive" : ""}
                    />
                    {validationErrors.twilioSid && (
                      <p className="text-xs text-destructive">{validationErrors.twilioSid}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilioApiKey">Twilio API Key</Label>
                    <Input
                      id="twilioApiKey"
                      name="twilioApiKey"
                      placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={localSettings.twilioApiKey}
                      onChange={handleInputChange}
                      className={validationErrors.twilioApiKey ? "border-destructive" : ""}
                    />
                    {validationErrors.twilioApiKey && (
                      <p className="text-xs text-destructive">{validationErrors.twilioApiKey}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilioPhoneNumber">Twilio Phone Number</Label>
                    <Input
                      id="twilioPhoneNumber"
                      name="twilioPhoneNumber"
                      placeholder="+1xxxxxxxxxx"
                      value={localSettings.twilioPhoneNumber}
                      onChange={handleInputChange}
                      className={validationErrors.twilioPhoneNumber ? "border-destructive" : ""}
                    />
                    {validationErrors.twilioPhoneNumber && (
                      <p className="text-xs text-destructive">{validationErrors.twilioPhoneNumber}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://docs.starlis.com/twilio-setup" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Twilio Setup Guide
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="7" fill="#5D5AFF" />
                      <path d="M6 9L6 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <path d="M10 7L10 17" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <path d="M14 10L14 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <path d="M18 8L18 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h3 className="font-medium text-sm">ElevenLabs Integration</h3>
                  </div>
                  {isElevenLabsComplete && <span className="text-xs font-medium text-green-500">Complete</span>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="elevenLabsApiKey">ElevenLabs API Key</Label>
                    <Input
                      id="elevenLabsApiKey"
                      name="elevenLabsApiKey"
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={localSettings.elevenLabsApiKey}
                      onChange={handleInputChange}
                      className={validationErrors.elevenLabsApiKey ? "border-destructive" : ""}
                    />
                    {validationErrors.elevenLabsApiKey && (
                      <p className="text-xs text-destructive">{validationErrors.elevenLabsApiKey}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="elevenLabsAgentId">ElevenLabs Agent ID</Label>
                    <Input
                      id="elevenLabsAgentId"
                      name="elevenLabsAgentId"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={localSettings.elevenLabsAgentId}
                      onChange={handleInputChange}
                      className={validationErrors.elevenLabsAgentId ? "border-destructive" : ""}
                    />
                    {validationErrors.elevenLabsAgentId && (
                      <p className="text-xs text-destructive">{validationErrors.elevenLabsAgentId}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://docs.starlis.com/elevenlabs-setup" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      ElevenLabs Setup Guide
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowSkipWarning(true)}>
              Skip for now
            </Button>
            <Button onClick={handleNext} disabled={isLoading || !isFormComplete}>
              {isLoading ? "Processing..." : "Continue"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limited Voice Functionality</AlertDialogTitle>
            <AlertDialogDescription>
              Without voice setup, Starlis will not be able to make or receive phone calls or use voice responses. You
              will still be able to use text-based communication through email and chat. You can always set up voice
              capabilities later from your dashboard settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleSkip}>Continue Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

