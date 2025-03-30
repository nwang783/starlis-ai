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
import { Check } from "lucide-react"

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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className="h-5 w-5"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <div className="text-lg font-medium">Google</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Connect your Google account to sign in, send emails, and manage your calendar events.
                </div>
                <Button variant="outline" className="w-full justify-start">
                  <Check className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 23 23"
                      width="24"
                      height="24"
                      className="h-5 w-5"
                    >
                      <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                      <path fill="#f35325" d="M1 1h10v10H1z" />
                      <path fill="#81bc06" d="M12 1h10v10H12z" />
                      <path fill="#05a6f0" d="M1 12h10v10H1z" />
                      <path fill="#ffba08" d="M12 12h10v10H12z" />
                    </svg>
                  </div>
                  <div className="text-lg font-medium">Microsoft</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Connect your Microsoft account to sign in, send emails through Outlook, and manage your calendar
                  events.
                </div>
                <Button variant="outline" className="w-full justify-start">
                  <Check className="mr-2 h-4 w-4" />
                  Connect
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

