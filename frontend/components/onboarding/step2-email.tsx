"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy, ExternalLink, Mail, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/firebase" // Import Firebase auth

export function Step1EmailSetup({ 
  secretaryName = "AI Assistant",
  username,
  personality = "helpful and professional",
  customInstructions = "",
  onNext 
}: { 
  secretaryName?: string;
  username?: string;
  personality?: string;
  customInstructions?: string;
  onNext: (data: any) => void 
}) {
  const { toast } = useToast()
  const [user, setUser] = useState(auth.currentUser)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingEmail, setIsCreatingEmail] = useState(true)
  const [email, setEmail] = useState("")
  const [secretaryId, setSecretaryId] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);
  
  const createEmail = async () => {
    setIsCreatingEmail(true)
    setError(null)
    
    // Check if user is authenticated
    if (!user || !user.uid) {
      setError("You must be logged in to create an email address");
      setIsCreatingEmail(false);
      return;
    }
    
    try {
      const response = await fetch("https://create-ai-secretary-email-ah27ntyoya-uc.a.run.app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.uid, // Use the user ID from authentication
          secretary_name: secretaryName,
          username: username || user.displayName?.split(' ')[0]?.toLowerCase() || 'ai', // Use first name if available
          personality: personality,
          custom_instructions: customInstructions,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText || 'Unknown error'}`);
      }
      
      const data = await response.json();
      setEmail(data.email);
      setSecretaryId(data.secretary_id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create email address");
      console.error("Error creating email:", err);
    } finally {
      setIsCreatingEmail(false);
    }
  }
  
  useEffect(() => {
    // Only create email when user data is available
    if (user && user.uid) {
      createEmail();
    } else if (!user) {
      setError("You must be logged in to create an email address");
      setIsCreatingEmail(false);
    }
  }, [user]); // Re-run when user auth state changes

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email)
    toast({
      title: "Email copied",
      description: "Your Starlis forwarding email has been copied to clipboard.",
    })
  }

  const handleNext = () => {
    setIsLoading(true)
    // Pass the secretary data to the next step
    setTimeout(() => {
      setIsLoading(false)
      onNext({ email, secretaryId })
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
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center space-x-2">
              <Input 
                value={isCreatingEmail ? "Creating your email address..." : email} 
                readOnly 
                className="font-mono" 
                disabled={isCreatingEmail}
              />
              {isCreatingEmail ? (
                <Button variant="outline" size="icon" disabled>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="sr-only">Creating email</span>
                </Button>
              ) : error ? (
                <Button variant="outline" size="icon" onClick={createEmail}>
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Retry</span>
                </Button>
              ) : (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy email address</span>
                </Button>
              )}
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
        <Button 
          onClick={handleNext} 
          disabled={isLoading || isCreatingEmail || !email || !!error}
        >
          {isLoading ? "Processing..." : "Continue to Integrations"}
        </Button>
      </CardFooter>
    </Card>
  )
}

