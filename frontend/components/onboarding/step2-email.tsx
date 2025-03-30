"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy, ExternalLink, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Step1EmailSetup({ starlisEmail, onNext }: { starlisEmail: string; onNext: (data: any) => void }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(starlisEmail)
    toast({
      title: "Email copied",
      description: "Your Starlis forwarding email has been copied to clipboard.",
    })
  }

  const handleNext = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      onNext({})
    }, 500)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Step 2: Set Up Email Forwarding</CardTitle>
        <CardDescription>Configure your email client to forward messages to your Starlis assistant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/50 p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Your Starlis Forwarding Email</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This is your unique Starlis email address. Forward emails to this address to have them processed by your AI
              assistant.
            </p>
            <div className="flex items-center space-x-2">
              <Input value={starlisEmail} readOnly className="font-mono" />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy email address</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">How to Set Up Email Forwarding</h3>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              To get the most out of Starlis, you'll need to set up email forwarding in your personal email client:
            </p>
            <ol className="ml-6 list-decimal text-sm text-muted-foreground space-y-2">
              <li>Log in to your email account (Gmail, Outlook, etc.)</li>
              <li>Navigate to your email settings</li>
              <li>Find the forwarding or rules/filters section</li>
              <li>Create a new rule to forward emails to your Starlis email address</li>
              <li>Save your changes</li>
            </ol>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <a href="https://docs.starlis.com/email-setup" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Detailed Setup Guide
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleNext} disabled={isLoading}>
          {isLoading ? "Processing..." : "Continue to Integrations"}
        </Button>
      </CardFooter>
    </Card>
  )
}

