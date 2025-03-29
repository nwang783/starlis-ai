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
        onNext(localSettings)
      }, 500)
    }
  }

  const handleSkip = () => {
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
          <CardTitle className="text-2xl">Step 3: Set Up Voice Capabilities</CardTitle>
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
                    <svg className="h-6 w-6 text-[#F22F46]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.8,13.75a1,1,0,0,0-1.39.26,1.24,1.24,0,0,1-1,.53,1.29,1.29,0,0,1-1-.53l-4.94-6.69a3.26,3.26,0,0,0-2.62-1.32,3.23,3.23,0,0,0-2.61,1.32L1.59,11.45a.92.92,0,0,0,.16,1.31.94.94,0,0,0,1.31-.15L5.7,8.48a1.29,1.29,0,0,1,1-.53,1.29,1.29,0,0,1,1,.53L12.7,15.17a3.21,3.21,0,0,0,2.61,1.32,3.2,3.2,0,0,0,2.62-1.32l2.13-2.89A1,1,0,0,0,17.8,13.75Z" />
                      <path d="M17.25,0H6.75A2.75,2.75,0,0,0,4,2.75v18.5A2.75,2.75,0,0,0,6.75,24h10.5A2.75,2.75,0,0,0,20,21.25V2.75A2.75,2.75,0,0,0,17.25,0ZM12,22a1.25,1.25,0,1,1,1.25-1.25A1.25,1.25,0,0,1,12,22Z" />
                    </svg>
                    <h3 className="font-medium">Twilio Integration</h3>
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
                    <svg className="h-6 w-6 text-[#5D5AFF]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" />
                      <path d="M15,11H13V7a1,1,0,0,0-2,0v5a1,1,0,0,0,1,1h3a1,1,0,0,0,0-2Z" />
                    </svg>
                    <h3 className="font-medium">ElevenLabs Integration</h3>
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

