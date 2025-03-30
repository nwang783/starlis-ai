"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

type IntegrationsData = {
  googleCalendar: boolean
  outlookCalendar: boolean
}

export function Step2Integrations({
  integrations,
  onNext,
  onBack,
}: {
  integrations: IntegrationsData
  onNext: (data: IntegrationsData) => void
  onBack: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [localIntegrations, setLocalIntegrations] = useState<IntegrationsData>(integrations)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const handleConnectGoogle = async () => {
    setIsLoading(true)
    // Simulate API call for Google Calendar OAuth
    setTimeout(() => {
      setLocalIntegrations((prev) => ({
        ...prev,
        googleCalendar: true,
      }))
      setIsLoading(false)
    }, 1500)
  }

  const handleConnectOutlook = async () => {
    setIsLoading(true)
    // Simulate API call for Outlook Calendar OAuth
    setTimeout(() => {
      setLocalIntegrations((prev) => ({
        ...prev,
        outlookCalendar: true,
      }))
      setIsLoading(false)
    }, 1500)
  }

  const handleNext = () => {
    // If no integrations are connected, show warning
    if (!localIntegrations.googleCalendar && !localIntegrations.outlookCalendar) {
      setShowSkipWarning(true)
    } else {
      // Continue to next step
      onNext(localIntegrations)
    }
  }

  const handleSkip = () => {
    onNext(localIntegrations)
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Step 3: Connect Calendar Integrations</CardTitle>
          <CardDescription>Connect your calendar accounts to enable Starlis to manage your schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Connecting your calendars allows Starlis to:</p>
            <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
              <li>Schedule meetings and appointments</li>
              <li>Send calendar invites to participants</li>
              <li>Check your availability before scheduling</li>
              <li>Provide reminders for upcoming events</li>
              <li>Suggest optimal meeting times based on your schedule</li>
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 16.5H18" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M6 12.5H18" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M11 8.5H18" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" />
                    <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="#FBBC05" strokeWidth="1.5" />
                    <path d="M8 2.5V6.5" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 2.5V6.5" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <h3 className="font-medium text-sm">Google Calendar</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your Google Calendar to manage events and meetings.
                </p>
                <Button
                  variant={localIntegrations.googleCalendar ? "default" : "outline"}
                  onClick={handleConnectGoogle}
                  disabled={isLoading || localIntegrations.googleCalendar}
                >
                  {localIntegrations.googleCalendar ? "Connected" : "Connect Google Calendar"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4 relative group">
              <div
                className="absolute inset-0 bg-black/5 rounded-lg flex items-center justify-center z-10"
                aria-hidden="true"
              >
                <span className="bg-black/75 text-white text-xs px-2 py-1 rounded">Coming Soon</span>
              </div>
              <div className="flex flex-col space-y-4 opacity-70">
                <div className="flex items-center space-x-2">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 5L14 10L7 5H21Z" fill="#0078D4" />
                    <path
                      d="M3 5.5V18.5C3 19.0523 3.44772 19.5 4 19.5H20C20.5523 19.5 21 19.0523 21 18.5V5.5L12 12.5L3 5.5Z"
                      fill="#0078D4"
                    />
                    <path
                      d="M3 5.5L12 12.5L21 5.5"
                      stroke="#0078D4"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 18.5L9 12.5"
                      stroke="#0078D4"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 18.5L15 12.5"
                      stroke="#0078D4"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h3 className="font-medium text-sm">Outlook Calendar</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your Outlook Calendar to manage events and meetings.
                </p>
                <Button variant="outline" disabled={true} className="cursor-not-allowed">
                  Connect Outlook Calendar
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <a href="https://docs.starlis.com/calendar-integrations" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Integration Guide
              </a>
            </Button>
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
            <Button onClick={handleNext}>Continue to Voice Setup</Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limited Functionality Warning</AlertDialogTitle>
            <AlertDialogDescription>
              Without calendar integrations, Starlis will have reduced functionality and can only respond to emails.
              Calendar management, scheduling meetings, and checking availability will not be available. You can always
              set up these integrations later from your dashboard settings.
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

