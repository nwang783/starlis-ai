"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Loader2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { doc, updateDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

// Define type for Google OAuth response
type GoogleOAuthResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
  id_token?: string
}

type IntegrationsData = {
  google: boolean
  microsoft: boolean
}

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/auth/google/callback`
  : '';

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile"
];

export function Step3ExternalIntegrations({
  integrations,
  onNext,
  onBack,
}: {
  integrations: IntegrationsData
  onNext: (data: IntegrationsData) => void
  onBack: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [connectingGoogle, setConnectingGoogle] = useState(false)
  const [connectingMicrosoft, setConnectingMicrosoft] = useState(false)
  const [localIntegrations, setLocalIntegrations] = useState<IntegrationsData>(integrations)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  // Initialize with data from props
  useEffect(() => {
    setLocalIntegrations(integrations)
  }, [integrations])

  // Listen for OAuth redirect response
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      // Check if we have a code in the URL (OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state === 'google-oauth') {
        try {
          setConnectingGoogle(true);
          
          // Exchange code for token
          const tokenResponse = await exchangeCodeForToken(code);
          
          if (user && tokenResponse) {
            // Save tokens to Firestore
            await saveGoogleTokensToFirestore(tokenResponse);
            
            // Update local state
            setLocalIntegrations(prev => ({
              ...prev,
              google: true
            }));
            
            // Show success toast
            toast({
              title: "Google connected",
              description: "Your Google account has been connected successfully.",
            });
            
            // Remove code from URL to prevent reprocessing on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error("Error processing OAuth redirect:", error);
          toast({
            title: "Connection failed",
            description: "Failed to connect Google account. Please try again.",
            variant: "destructive",
          });
        } finally {
          setConnectingGoogle(false);
        }
      }
    };
    
    handleOAuthRedirect();
  }, [user, toast]);

  // Exchange authorization code for tokens
  const exchangeCodeForToken = async (code: string): Promise<GoogleOAuthResponse | null> => {
    try {
      const response = await fetch('/api/auth/google/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirect_uri: GOOGLE_REDIRECT_URI }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return null;
    }
  };

  // Save tokens to Firestore
  const saveGoogleTokensToFirestore = async (tokenData: GoogleOAuthResponse) => {
    if (!user) return;
    
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);
    
    // Store token directly in the user document
    await updateDoc(doc(db, "users", user.uid), {
      "google_oauth_token": {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiryDate.toISOString(),
        scopes: tokenData.scope.split(' '),
        created_at: new Date().toISOString(),
      },
      "integrations.google": true
    });
  };

  // Initiate Google OAuth flow
  const initiateGoogleOAuth = () => {
    const scope = GOOGLE_SCOPES.join(' ');
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', 'google-oauth');
    
    // Redirect to Google's OAuth page
    window.location.href = authUrl.toString();
  };

  // Revoke Google access
  const revokeGoogleAccess = async () => {
    if (!user) return;
    
    try {
      // Call your API to revoke the token
      await fetch('/api/auth/google/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });
      
      // Update the user document to clear token and set integration to false
      await updateDoc(doc(db, "users", user.uid), {
        "google_oauth_token": {
          access_token: null,
          refresh_token: null,
          expires_at: null,
          scopes: [],
          revoked_at: new Date().toISOString(),
        },
        "integrations.google": false
      });
    } catch (error) {
      console.error("Error revoking access:", error);
      throw error;
    }
  };

  const handleConnectGoogle = async () => {
    if (localIntegrations.google) {
      // Disconnect Google
      setConnectingGoogle(true);
      try {
        await revokeGoogleAccess();
        
        setLocalIntegrations((prev) => ({
          ...prev,
          google: false,
        }));

        toast({
          title: "Google disconnected",
          description: "Your Google account has been disconnected successfully.",
        });
      } catch (error) {
        console.error("Error disconnecting Google:", error);
        toast({
          title: "Error",
          description: "Failed to disconnect Google. Please try again.",
          variant: "destructive",
        });
      } finally {
        setConnectingGoogle(false);
      }
    } else {
      // Connect Google
      setConnectingGoogle(true);
      try {
        initiateGoogleOAuth();
        // Note: The component will rerender after redirect
      } catch (error) {
        console.error("Error connecting Google:", error);
        toast({
          title: "Error",
          description: "Failed to initiate Google connection. Please try again.",
          variant: "destructive",
        });
        setConnectingGoogle(false);
      }
    }
  };

  const handleConnectMicrosoft = async () => {
    if (localIntegrations.microsoft) {
      // Disconnect Microsoft
      setConnectingMicrosoft(true)
      try {
        // In a real app, this would revoke OAuth tokens
        if (user) {
          await updateDoc(doc(db, "users", user.uid), {
            "integrations.microsoft": false,
          })
        }

        setLocalIntegrations((prev) => ({
          ...prev,
          microsoft: false,
        }))

        toast({
          title: "Microsoft disconnected",
          description: "Your Microsoft account has been disconnected successfully.",
        })
      } catch (error) {
        console.error("Error disconnecting Microsoft:", error)
        toast({
          title: "Error",
          description: "Failed to disconnect Microsoft. Please try again.",
          variant: "destructive",
        })
      } finally {
        setConnectingMicrosoft(false)
      }
    } else {
      // Connect Microsoft
      setConnectingMicrosoft(true)
      try {
        // In a real app, this would initiate OAuth flow
        // Simulate API call for Microsoft OAuth
        await new Promise((resolve) => setTimeout(resolve, 1500))

        if (user) {
          await updateDoc(doc(db, "users", user.uid), {
            "integrations.microsoft": true,
          })
        }

        setLocalIntegrations((prev) => ({
          ...prev,
          microsoft: true,
        }))

        toast({
          title: "Microsoft connected",
          description: "Your Microsoft account has been connected successfully.",
        })
      } catch (error) {
        console.error("Error connecting Microsoft:", error)
        toast({
          title: "Error",
          description: "Failed to connect Microsoft. Please try again.",
          variant: "destructive",
        })
      } finally {
        setConnectingMicrosoft(false)
      }
    }
  }

  const handleNext = () => {
    // If no integrations are connected, show warning
    if (!localIntegrations.google && !localIntegrations.microsoft) {
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
          <CardTitle className="text-2xl">Step 3: Connect External Integrations</CardTitle>
          <CardDescription>Connect your accounts to enable Starlis to work with your existing services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Connecting your accounts allows Starlis to:</p>
            <ul className="ml-6 list-disc text-sm text-muted-foreground space-y-2">
              <li>Sign in using your existing accounts</li>
              <li>Send and receive emails on your behalf</li>
              <li>Schedule meetings and manage your calendar</li>
              <li>Access your contacts for easier communication</li>
              <li>Provide a seamless experience across your digital services</li>
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
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
                  {localIntegrations.google && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-900/30 dark:text-green-400"
                    >
                      Connected
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Connect your Google account to sign in, send emails, and manage your calendar events.
                </div>
                <Button
                  variant={localIntegrations.google ? "destructive" : "outline"}
                  className="w-full justify-center"
                  onClick={handleConnectGoogle}
                  disabled={connectingGoogle}
                >
                  {connectingGoogle ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {localIntegrations.google ? "Disconnecting..." : "Connecting..."}
                    </>
                  ) : (
                    <>{localIntegrations.google ? "Disconnect" : "Connect"}</>
                  )}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border p-4 relative bg-gray-50 dark:bg-gray-800/50">
              <div className="absolute top-2 right-2">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  Coming Soon
                </Badge>
              </div>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
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
                </div>
                <div className="text-sm text-muted-foreground">
                  Connect your Microsoft account to sign in, send emails through Outlook, and manage your calendar
                  events.
                </div>
                <Button variant="outline" className="w-full justify-center opacity-70" disabled={true}>
                  Available Soon
                </Button>
                <p className="text-xs text-muted-foreground italic">
                  We're working on adding Microsoft integration. Check back soon!
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <a href="https://docs.starlis.com/integrations" target="_blank" rel="noopener noreferrer">
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
              Without external integrations, Starlis will have reduced functionality. Features like email management,
              calendar scheduling, and single sign-on will not be available. You can always set up these integrations
              later from your dashboard settings.
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
