"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Cog, ExternalLink, Mail, Phone } from "lucide-react"

export function Step4Completion({
  onComplete,
  onBack,
}: {
  onComplete: () => void
  onBack: () => void
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Setup Complete!</CardTitle>
        <CardDescription>Your Starlis assistant is ready to help you be more productive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-center">Thank You for Setting Up Starlis</h2>
          <p className="text-center text-muted-foreground mt-2 max-w-md">
            Your AI assistant is now configured and ready to help you manage emails, schedule meetings, and boost your
            productivity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="rounded-full bg-primary/10 p-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Email Management</h3>
              <p className="text-sm text-muted-foreground">
                Starlis will process your forwarded emails and help you manage your inbox efficiently.
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="rounded-full bg-primary/10 p-2">
                <svg
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d="M16 2V5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 8H21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 11H8.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 11H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 11H16.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 15H8.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 15H16.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="font-medium">Calendar Management</h3>
              <p className="text-sm text-muted-foreground">
                Schedule meetings, check availability, and manage your calendar events with ease.
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="rounded-full bg-primary/10 p-2">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Voice Capabilities</h3>
              <p className="text-sm text-muted-foreground">
                Make and receive calls, get voice responses, and handle voice commands.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center space-x-2">
            <Cog className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You can modify your settings and integrations at any time from the dashboard settings page.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <Button variant="outline" asChild>
            <a href="https://docs.starlis.com/getting-started" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Documentation
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://docs.starlis.com/tutorials" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Watch Tutorials
            </a>
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onComplete}>Go to Dashboard</Button>
      </CardFooter>
    </Card>
  )
}

