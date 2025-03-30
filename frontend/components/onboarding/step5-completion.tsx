"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Cog, ExternalLink } from "lucide-react"

export function Step4Completion({
  onComplete,
  onBack,
}: {
  onComplete: () => void
  onBack: () => void
}) {
  console.log("Rendering Step4Completion component")

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

