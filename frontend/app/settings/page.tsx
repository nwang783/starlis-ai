"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "../../components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Download, Trash2, Mic, Mail, Copy, Calendar, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  updateUserData,
  updateSmtpSettings,
  updateIntegrationSettings,
  regenerateStarlisEmail,
  toggle2FA,
  verifyPassword,
  db,
} from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { collection, query, getDocs, doc, setDoc, updateDoc, serverTimestamp, where, getDoc } from "firebase/firestore"

import { TwoFactorSetup } from "@/components/two-factor-setup"
import { ExportDataModal } from "@/components/export-data-modal"
import { DeleteAccountFlow } from "@/components/delete-account-flow"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { get } from "http"

// Define the type for Google OAuth response
type GoogleOAuthResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
  id_token?: string
}

// Add Google OAuth configuration constants
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/auth/google/callback`
  : '';

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events"
];

export default function SettingsPage() {
  const { userData, user, refreshUserData } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [starlisEmail, setStarlisEmail] = useState("")
  const [smtpSettings, setSmtpSettings] = useState({
    smtpUsername: "",
    smtpPassword: "",
    smtpPort: "",
    smtpServer: "",
    smtpEncryption: "tls",
  })
  const [integrations, setIntegrations] = useState({
    googleCalendar: false,
    outlookCalendar: false,
    appleCalendar: false,
    gmail: false,
    discord: false,
    twitter: false,
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showSmtpModal, setShowSmtpModal] = useState(false)
  const [smtpFormData, setSmtpFormData] = useState({
    smtpServer: "",
    smtpUsername: "",
    smtpPassword: "",
    smtpPort: "",
    smtpEncryption: "tls",
  })

  // Calendar settings state
  const [defaultMeetingDuration, setDefaultMeetingDuration] = useState("30")
  const [bufferTime, setBufferTime] = useState("15")
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00")
  const [workingHoursEnd, setWorkingHoursEnd] = useState("17:00")
  const [workingDays, setWorkingDays] = useState(["monday", "tuesday", "wednesday", "thursday", "friday"])
  const [autoAcceptMeetings, setAutoAcceptMeetings] = useState(false)

  // Handling settings state
  const [autoReplyToEmails, setAutoReplyToEmails] = useState(false)
  const [autoScheduleMeetings, setAutoScheduleMeetings] = useState(false)
  const [autoSuggestTimes, setAutoSuggestTimes] = useState(true)
  const [confirmBeforeSending, setConfirmBeforeSending] = useState(true)
  const [emailResponseStyle, setEmailResponseStyle] = useState("professional")

  // Add these new state variables
  const [emailResponseMode, setEmailResponseMode] = useState("assistant")
  const [allowCallForwarding, setAllowCallForwarding] = useState(false)
  const [requireCallConfirmation, setRequireCallConfirmation] = useState(true)
  const [startupPage, setStartupPage] = useState("dashboard")

  // Add state variables for Twilio and ElevenLabs form data
  const [twilioFormData, setTwilioFormData] = useState({
    twilioSid: "",
    twilioApiKey: "",
    twilioPhoneNumber: "",
  })

  const [elevenLabsFormData, setElevenLabsFormData] = useState({
    elevenLabsApiKey: "",
    elevenLabsAgentId: "",
  })

  // Add state variables to track completion status
  const [twilioComplete, setTwilioComplete] = useState(false)
  const [elevenLabsComplete, setElevenLabsComplete] = useState(false)

  // Add state for export data and delete account modals
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteAccountFlow, setShowDeleteAccountFlow] = useState(false)

  // Add state variables for assistant settings
  const [assistantName, setAssistantName] = useState("Starlis")
  const [customInstructions, setCustomInstructions] = useState(
    "You are Starlis, a helpful assistant designed to manage emails, schedule meetings, and boost productivity. You are professional, efficient, and friendly. You help users manage their time, respond to emails, and organize their schedule.",
  )
  const [personality, setPersonality] = useState("helpful and professional")

  // Add a new state for voice settings
  const [voiceId, setVoiceId] = useState("default")
  const [voiceStability, setVoiceStability] = useState("0.5")
  const [voiceClarity, setVoiceClarity] = useState("0.5")
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneError, setPhoneError] = useState("")

  // Add a new state variable for the voice settings modal
  const [showVoiceModal, setShowVoiceModal] = useState(false)

  // Add state for deactivation confirmation modals
  const [showDeactivateVoiceModal, setShowDeactivateVoiceModal] = useState(false)
  const [showDeactivateSmtpModal, setShowDeactivateSmtpModal] = useState(false)

  const [showRegenerateWarningModal, setShowRegenerateWarningModal] = useState(false)
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false)
  const [regeneratePassword, setRegeneratePassword] = useState("")
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  // Fix the getAIEmail function to properly use async/await
  const getAIEmail = async () => {
    if (!user) return "";
    try {
      const secretariesRef = collection(db, "ai_secretaries");
      const q = query(secretariesRef, where("user_id", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("No AI secretary found for user");
        return "";
      }
      
      // Use the first secretary found (there should generally only be one per user)
      const secretaryData = querySnapshot.docs[0].data();
      return secretaryData.email || "";
    } catch (error) {
      console.error("Error fetching AI secretary email:", error);
      return "";
    }
  };

  // Fix the useEffect to properly handle the async function and maintain stable dependencies
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        // Fetch user data
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)
        const userData = userDoc.data()

        if (userData) {
          // Initialize general settings
          setFirstName(userData.firstName || "")
          setLastName(userData.lastName || "")
          setPhoneNumber(userData.phoneNumber ? formatPhoneNumber(userData.phoneNumber.replace(/^\+1/, "")) : "")

          // Initialize handling settings
          if (userData.handling) {
            setAutoReplyToEmails(userData.handling.autoReplyToEmails || false)
            setAutoScheduleMeetings(userData.handling.autoScheduleMeetings || false)
            setAutoSuggestTimes(userData.handling.autoSuggestTimes !== false)
            setConfirmBeforeSending(userData.handling.confirmBeforeSending !== false)
            setEmailResponseStyle(userData.handling.emailResponseStyle || "professional")
            setEmailResponseMode(userData.handling.emailResponseMode || "assistant")
            setAllowCallForwarding(userData.handling.allowCallForwarding || false)
            setRequireCallConfirmation(userData.handling.requireCallConfirmation !== false)
            setStartupPage(userData.handling.startupPage || "dashboard")
          }

          // Initialize Twilio and ElevenLabs form data
          setTwilioFormData({
            twilioSid: userData.voice?.twilioSid || userData.onboarding?.voice?.twilioSid || "",
            twilioApiKey: userData.voice?.twilioApiKey || userData.onboarding?.voice?.twilioApiKey || "",
            twilioPhoneNumber: userData.voice?.twilioPhoneNumber || userData.onboarding?.voice?.twilioPhoneNumber || "",
          })

          setElevenLabsFormData({
            elevenLabsApiKey: userData.voice?.elevenLabsApiKey || userData.onboarding?.voice?.elevenLabsApiKey || "",
            elevenLabsAgentId: userData.voice?.elevenLabsAgentId || userData.onboarding?.voice?.elevenLabsAgentId || "",
          })

          // Check if credentials are complete
          setTwilioComplete(
            !!(userData.voice?.twilioSid || userData.onboarding?.voice?.twilioSid) &&
              !!(userData.voice?.twilioApiKey || userData.onboarding?.voice?.twilioApiKey) &&
              !!(userData.voice?.twilioPhoneNumber || userData.onboarding?.voice?.twilioPhoneNumber),
          )

          setElevenLabsComplete(
            !!(userData.voice?.elevenLabsApiKey || userData.onboarding?.voice?.elevenLabsApiKey) &&
              !!(userData.voice?.elevenLabsAgentId || userData.onboarding?.voice?.elevenLabsAgentId),
          )

          // Fetch assistant settings from ai_secretaries collection
          const secretariesRef = collection(db, "ai_secretaries")
          const q = query(secretariesRef, where("user_id", "==", user.uid))
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            const secretaryData = querySnapshot.docs[0].data()
            setAssistantName(secretaryData.name || "Starlis")
            setCustomInstructions(secretaryData.custom_instructions || "You are Starlis, a helpful assistant designed to manage emails, schedule meetings, and boost productivity. You are professional, efficient, and friendly. You help users manage their time, respond to emails, and organize their schedule.")
            setPersonality(secretaryData.personality || "helpful and professional")
            setVoiceEnabled(secretaryData.voice_enabled !== false)
          } else {
            // Set default values if no secretary exists
            setAssistantName("Starlis")
            setCustomInstructions("You are Starlis, a helpful assistant designed to manage emails, schedule meetings, and boost productivity. You are professional, efficient, and friendly. You help users manage their time, respond to emails, and organize their schedule.")
            setPersonality("helpful and professional")
            setVoiceEnabled(true)
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        })
      }
    }

    fetchUserData()
  }, [user, toast])

  // Add these functions after your state declarations

  // Function to initiate Google OAuth
  const initiateGoogleOAuth = () => {
    console.log("Initiating Google OAuth flow");
    
    const scope = GOOGLE_SCOPES.join(' ');
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    
    console.log("Using redirect URI:", redirectUri);
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    // Create a state parameter that includes where to redirect after auth
    const stateParam = JSON.stringify({
      origin: 'settings',
      timestamp: Date.now(),
      tab: 'integrations' // Include tab information for redirect back
    });
    
    console.log("State parameter:", stateParam);
    
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', stateParam);
    
    console.log("Redirecting to:", authUrl.toString());
    
    // Redirect to Google's OAuth page
    window.location.href = authUrl.toString();
  };

  // Exchange authorization code for tokens
  const exchangeCodeForToken = async (code: string): Promise<GoogleOAuthResponse | null> => {
    try {
      console.log("Exchanging code for token...");
      
      // Use the EXACT same redirect URI that was used in the initial authorization request
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      
      const response = await fetch('/api/auth/google/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          redirect_uri: redirectUri 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Token exchange failed:", errorData);
        throw new Error(`Failed to exchange code for token: ${JSON.stringify(errorData)}`);
      }
      
      const tokenData = await response.json();
      console.log("Token exchange successful");
      return tokenData;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return null;
    }
  };

  // Save tokens to Firestore
  const saveGoogleTokensToFirestore = async (userId: string, tokenData: GoogleOAuthResponse) => {
    if (!tokenData) return;
    
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);
    
    await updateDoc(doc(db, "users", userId), {
      "google_oauth_token": {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiryDate.toISOString(),
        scopes: tokenData.scope.split(' '),
        created_at: new Date().toISOString(),
      },
      "integrations.googleCalendar": true
    });
  };

  // Revoke Google access
  const revokeGoogleAccess = async (userId: string) => {
    try {
      // Call your API to revoke the token
      await fetch('/api/auth/google/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      // Update the user document
      await updateDoc(doc(db, "users", userId), {
        "google_oauth_token": {
          access_token: null,
          refresh_token: null,
          expires_at: null,
          scopes: [],
          revoked_at: new Date().toISOString(),
        },
        "integrations.googleCalendar": false
      });
    } catch (error) {
      console.error("Error revoking access:", error);
      throw error;
    }
  };

  // Initialize form data from userData
  // Set active tab from URL parameter
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Handle Twilio input changes
  const handleTwilioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTwilioFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle ElevenLabs input changes
  const handleElevenLabsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setElevenLabsFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Save Twilio settings
  const handleSaveTwilioSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Update voice settings in Firebase - update both paths to ensure consistency
      await updateUserData(user.uid, {
        voice: {
          ...userData?.voice,
          twilioSid: twilioFormData.twilioSid,
          twilioApiKey: twilioFormData.twilioApiKey,
          twilioPhoneNumber: twilioFormData.twilioPhoneNumber,
        },
        onboarding: {
          ...userData?.onboarding,
          voice: {
            ...userData?.onboarding?.voice,
            twilioSid: twilioFormData.twilioSid,
            twilioApiKey: twilioFormData.twilioApiKey,
            twilioPhoneNumber: twilioFormData.twilioPhoneNumber,
            elevenLabsApiKey: userData?.onboarding?.voice?.elevenLabsApiKey || userData?.voice?.elevenLabsApiKey || "",
            elevenLabsAgentId:
              userData?.onboarding?.voice?.elevenLabsAgentId || userData?.voice?.elevenLabsAgentId || "",
          },
        },
      })

      setTwilioComplete(
        !!twilioFormData.twilioSid && !!twilioFormData.twilioApiKey && !!twilioFormData.twilioPhoneNumber,
      )

      await refreshUserData()

      toast({
        title: "Twilio settings saved",
        description: "Your Twilio settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving Twilio settings:", error)
      toast({
        title: "Error",
        description: "Failed to save Twilio settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Save ElevenLabs settings
  const handleSaveElevenLabsSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Update voice settings in Firebase - update both paths to ensure consistency
      await updateUserData(user.uid, {
        voice: {
          ...userData?.voice,
          elevenLabsApiKey: elevenLabsFormData.elevenLabsApiKey,
          elevenLabsAgentId: elevenLabsFormData.elevenLabsAgentId,
        },
        onboarding: {
          ...userData?.onboarding,
          voice: {
            ...userData?.onboarding?.voice,
            elevenLabsApiKey: elevenLabsFormData.elevenLabsApiKey,
            elevenLabsAgentId: elevenLabsFormData.elevenLabsAgentId,
            twilioSid: userData?.onboarding?.voice?.twilioSid || userData?.voice?.twilioSid || "",
            twilioApiKey: userData?.onboarding?.voice?.twilioApiKey || userData?.voice?.twilioApiKey || "",
            twilioPhoneNumber:
              userData?.onboarding?.voice?.twilioPhoneNumber || userData?.voice?.twilioPhoneNumber || "",
          },
        },
      })

      setElevenLabsComplete(!!elevenLabsFormData.elevenLabsApiKey && !!elevenLabsFormData.elevenLabsAgentId)

      await refreshUserData()

      toast({
        title: "ElevenLabs settings saved",
        description: "Your ElevenLabs settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving ElevenLabs settings:", error)
      toast({
        title: "Error",
        description: "Failed to save ElevenLabs settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Deactivate Voice Integration
  const handleDeactivateVoice = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Clear voice settings in Firebase
      await updateUserData(user.uid, {
        voice: {
          twilioSid: "",
          twilioApiKey: "",
          twilioPhoneNumber: "",
          elevenLabsApiKey: "",
          elevenLabsAgentId: "",
        },
        onboarding: {
          ...userData?.onboarding,
          voice: {
            twilioSid: "",
            twilioApiKey: "",
            twilioPhoneNumber: "",
            elevenLabsApiKey: "",
            elevenLabsAgentId: "",
          },
        },
      })

      // Update local state
      setTwilioFormData({
        twilioSid: "",
        twilioApiKey: "",
        twilioPhoneNumber: "",
      })
      setElevenLabsFormData({
        elevenLabsApiKey: "",
        elevenLabsAgentId: "",
      })
      setTwilioComplete(false)
      setElevenLabsComplete(false)

      // Close the modal
      setShowDeactivateVoiceModal(false)

      // Show success toast
      toast({
        title: "Voice integration deactivated",
        description: "Your voice integration has been deactivated successfully.",
      })

      await refreshUserData()
    } catch (error) {
      console.error("Error deactivating voice integration:", error)
      toast({
        title: "Error",
        description: "Failed to deactivate voice integration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveGeneralSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Format phone number for storage (strip non-digits and add country code)
      const formattedPhoneNumber = phoneNumber ? countryCode + phoneNumber.replace(/\D/g, "") : ""

      await updateUserData(user.uid, {
        firstName,
        lastName,
        phoneNumber: formattedPhoneNumber,
      })

      await refreshUserData()

      toast({
        title: "Settings updated",
        description: "Your general settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCalendarSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await updateUserData(user.uid, {
        calendar: {
          defaultMeetingDuration,
          bufferTime,
          workingHours: {
            start: workingHoursStart,
            end: workingHoursEnd,
          },
          workingDays,
          autoAcceptMeetings,
        },
      })

      await refreshUserData()

      toast({
        title: "Calendar settings saved",
        description: "Your calendar settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving calendar settings:", error)
      toast({
        title: "Error",
        description: "Failed to save calendar settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveHandlingSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await updateUserData(user.uid, {
        handling: {
          autoReplyToEmails,
          autoScheduleMeetings,
          autoSuggestTimes,
          confirmBeforeSending,
          emailResponseStyle,
          emailResponseMode,
          allowCallForwarding,
          requireCallConfirmation,
          startupPage,
        },
      })

      await refreshUserData()

      toast({
        title: "Handling settings saved",
        description: "Your AI handling settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving handling settings:", error)
      toast({
        title: "Error",
        description: "Failed to save handling settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateEmailWithPassword = async () => {
    if (!regeneratePassword.trim()) {
      setRegenerateError("Please enter your password")
      return
    }

    setIsLoading(true)
    setRegenerateError(null)

    try {
      // Verify the password
      await verifyPassword(regeneratePassword)

      // If password is correct, regenerate the email
      const newEmail = await handleRegenerateStarlisEmail()

      // Close the modal and clear the password
      setShowPasswordConfirmModal(false)
      setRegeneratePassword("")

      // Show success toast
      toast({
        title: "Email regenerated",
        description: `Your new forwarding email is ${newEmail}`,
      })
    } catch (err: any) {
      console.error("Password verification error:", err)
      setRegenerateError("Incorrect password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateStarlisEmail = async () => {
    if (!user) return ""

    setIsLoading(true)
    try {
      const newEmail = await regenerateStarlisEmail(user.uid, firstName, lastName)
      setStarlisEmail(newEmail)

      await refreshUserData()

      toast({
        title: "Email regenerated",
        description: "Your Starlis forwarding email has been regenerated successfully.",
      })

      return newEmail
    } catch (error) {
      console.error("Error regenerating email:", error)
      toast({
        title: "Error",
        description: "Failed to regenerate email. Please try again.",
        variant: "destructive",
      })
      return ""
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle2FA = async (enabled: boolean) => {
    if (!user) return

    setIsLoading(true)
    try {
      await toggle2FA(user.uid, enabled)
      setTwoFactorEnabled(enabled)

      await refreshUserData()

      toast({
        title: `Two-factor authentication ${enabled ? "enabled" : "disabled"}`,
        description: `Two-factor authentication has been ${enabled ? "enabled" : "disabled"} successfully.`,
      })
    } catch (error) {
      console.error("Error toggling 2FA:", error)
      toast({
        title: "Error",
        description: "Failed to update two-factor authentication settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Replace your existing handleConnectIntegration function
  const handleConnectIntegration = async (integration: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (integration === "googleCalendar") {
        // Initiate OAuth flow for Google
        initiateGoogleOAuth();
        // The function will return here because we're redirecting
        return;
      } else {
        // For other integrations, keep your existing code
        const updatedIntegrations = {
          ...integrations,
          [integration]: true,
        };

        await updateIntegrationSettings(user.uid, updatedIntegrations);
        setIntegrations(updatedIntegrations);

        await refreshUserData();

        toast({
          title: "Integration connected",
          description: `${integration} has been connected successfully.`,
        });
      }
    } catch (error) {
      console.error("Error connecting integration:", error);
      toast({
        title: "Error",
        description: "Failed to connect integration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Replace your existing handleDisconnectIntegration function
  const handleDisconnectIntegration = async (integration: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (integration === "googleCalendar") {
        // Special handling for Google - revoke the tokens
        await revokeGoogleAccess(user.uid);
      } else {
        // For other integrations, keep your existing code
        const updatedIntegrations = {
          ...integrations,
          [integration]: false,
        };

        await updateIntegrationSettings(user.uid, updatedIntegrations);
        setIntegrations(updatedIntegrations);
      }

      // Update local state
      setIntegrations((prev) => ({
        ...prev,
        [integration]: false,
      }));

      await refreshUserData();

      toast({
        title: "Integration disconnected",
        description: `${integration} has been disconnected successfully.`,
      });
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect integration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The email address has been copied to your clipboard.",
    })
  }

  const handleSmtpInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSmtpFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveSmtpSettings = async () => {
    setIsLoading(true)
    try {
      if (!user) return

      // Update the SMTP settings in Firebase
      await updateSmtpSettings(user.uid, smtpFormData)

      // Update local state
      setSmtpSettings(smtpFormData)

      // Close the modal
      setShowSmtpModal(false)

      // Show success toast
      toast({
        title: "SMTP settings saved",
        description: "Your SMTP settings have been saved successfully.",
      })

      // Refresh user data
      await refreshUserData()
    } catch (error) {
      console.error("Error saving SMTP settings:", error)
      toast({
        title: "Error",
        description: "Failed to save SMTP settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnectSmtp = async () => {
    setIsLoading(true)
    try {
      if (!user) return

      // Clear SMTP settings in Firebase
      const emptySettings = {
        smtpServer: "",
        smtpUsername: "",
        smtpPassword: "",
        smtpPort: "",
        smtpEncryption: "tls",
      }

      await updateSmtpSettings(user.uid, emptySettings)

      // Update local state
      setSmtpSettings(emptySettings)
      setSmtpFormData(emptySettings)

      // Close the modal
      setShowSmtpModal(false)
      setShowDeactivateSmtpModal(false)

      // Show success toast
      toast({
        title: "SMTP disconnected",
        description: "Your SMTP settings have been removed.",
      })

      // Refresh user data
      await refreshUserData()
    } catch (error) {
      console.error("Error disconnecting SMTP:", error)
      toast({
        title: "Error",
        description: "Failed to disconnect SMTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add this useEffect to initialize the SMTP form data when the modal opens
  useEffect(() => {
    if (showSmtpModal) {
      setSmtpFormData({
        smtpServer: smtpSettings.smtpServer,
        smtpUsername: smtpSettings.smtpUsername,
        smtpPassword: smtpSettings.smtpPassword,
        smtpPort: smtpSettings.smtpPort,
        smtpEncryption: smtpSettings.smtpEncryption,
      })
    }
  }, [showSmtpModal, smtpSettings])

  const handleSaveAssistantSettings = async () => {
    if (!user || !userData) return

    setIsLoading(true)
    try {
      // Search for the secretary document in ai_secretaries collection
      const secretariesRef = collection(db, "ai_secretaries")
      const q = query(secretariesRef, where("user_id", "==", user.uid))
      const querySnapshot = await getDocs(q)
      
      let secretaryDocRef
      if (querySnapshot.empty) {
        // If no secretary exists, create a new one
        secretaryDocRef = doc(collection(db, "ai_secretaries"))
        await setDoc(secretaryDocRef, {
          user_id: user.uid,
          name: assistantName,
          custom_instructions: customInstructions,
          personality: personality,
          email: userData.starlisForwardingEmail,
          user_email: userData.email,
          user_full_name: `${userData.firstName} ${userData.lastName}`,
          secretary_id: "helpful and professional",
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        })
      } else {
        // Update existing secretary
        secretaryDocRef = querySnapshot.docs[0].ref
        await updateDoc(secretaryDocRef, {
          name: assistantName,
          custom_instructions: customInstructions,
          personality: personality,
          updated_at: serverTimestamp()
        })
      }

      await refreshUserData()

      toast({
        title: "Assistant settings saved",
        description: "Your assistant settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving assistant settings:", error)
      toast({
        title: "Error",
        description: "Failed to save assistant settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveVoiceSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Search for the secretary document in ai_secretaries collection
      const secretariesRef = collection(db, "ai_secretaries")
      const q = query(secretariesRef, where("user_id", "==", user.uid))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const secretaryDocRef = querySnapshot.docs[0].ref
        await updateDoc(secretaryDocRef, {
          voice_enabled: voiceEnabled,
          updated_at: serverTimestamp()
        })
      }

      await refreshUserData()

      toast({
        title: "Voice settings saved",
        description: "Your voice assistant settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving voice settings:", error)
      toast({
        title: "Error",
        description: "Failed to save voice settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get only the digits
    const digits = e.target.value.replace(/\D/g, "")

    // Limit to 10 digits
    const trimmedDigits = digits.slice(0, 10)

    // Format the phone number
    let formattedNumber = ""
    if (trimmedDigits.length > 0) {
      formattedNumber = "("
      formattedNumber += trimmedDigits.slice(0, 3)

      if (trimmedDigits.length > 3) {
        formattedNumber += ") "
        formattedNumber += trimmedDigits.slice(3, 6)

        if (trimmedDigits.length > 6) {
          formattedNumber += "-"
          formattedNumber += trimmedDigits.slice(6, 10)
        }
      }
    }

    setPhoneNumber(formattedNumber)

    // Validate
    if (trimmedDigits.length > 0 && trimmedDigits.length < 10) {
      setPhoneError("Phone number must be 10 digits")
    } else {
      setPhoneError("")
    }
  }

  const formatPhoneNumber = (digits: string) => {
    if (!digits || digits.length === 0) return ""

    let formattedNumber = "("
    formattedNumber += digits.slice(0, 3)

    if (digits.length > 3) {
      formattedNumber += ") "
      formattedNumber += digits.slice(3, 6)

      if (digits.length > 6) {
        formattedNumber += "-"
        formattedNumber += digits.slice(6, 10)
      }
    }

    return formattedNumber
  }

  // Handle Export Data button click
  const handleExportData = () => {
    console.log("Opening Export Data modal")
    setShowExportModal(true)
  }

  // Handle Delete Account button click
  const handleDeleteAccount = () => {
    console.log("Opening Delete Account modal")
    setShowDeleteAccountFlow(true)
  }

  // Toggle working day selection
  const toggleWorkingDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day))
    } else {
      setWorkingDays([...workingDays, day])
    }
  }

  useEffect(() => {
    const handleOAuthResponse = async () => {
      // Check for OAuth code in the URL (if you're handling it client-side)
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      
      console.log("OAuth response detected:", { code, state });
      
      if (code && state) {
        try {
          setIsLoading(true);
          // Parse the state to confirm it's for this page
          let stateObj;
          try {
            stateObj = JSON.parse(decodeURIComponent(state));
          } catch (e) {
            console.error("Error parsing state:", e);
            stateObj = { origin: 'settings' }; // Default to settings if parsing fails
          }
          
          if (stateObj && (stateObj.origin === 'settings' || !stateObj.origin)) {
            // Exchange the code for tokens
            const tokens = await exchangeCodeForToken(code);
            
            if (tokens && user) {
              // Save the tokens to Firestore
              await saveGoogleTokensToFirestore(user.uid, tokens);
              
              // Update the local state
              setIntegrations(prev => ({
                ...prev,
                googleCalendar: true
              }));
              
              // Refresh user data
              await refreshUserData();
              
              toast({
                title: "Connected to Google Calendar",
                description: "Your Google Calendar is now connected to Starlis.",
              });
            }
          }
        } catch (error) {
          console.error("Error handling OAuth response:", error);
          toast({
            title: "Connection Failed",
            description: "Failed to connect to Google Calendar. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
          
          // Clean up the URL to remove the code and state parameters
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          url.searchParams.delete("state");
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    };
    
    handleOAuthResponse();
  }, [searchParams, user, refreshUserData]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="assistant">Assistant</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <TooltipProvider delayDuration={0}>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={5}>
                            <p>Only +1 (US/Canada) is supported for now</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-[90px]">
                        <Select value={countryCode} onValueChange={setCountryCode} disabled={isLoading}>
                          <SelectTrigger className="px-2">
                            <span className="text-left">+1</span>
                          </SelectTrigger>
                          <SelectContent className="min-w-[180px]">
                            <SelectItem value="+1">+1 (US/Canada)</SelectItem>
                            <SelectItem value="+44" disabled>
                              +44 (UK)
                            </SelectItem>
                            <SelectItem value="+61" disabled>
                              +61 (Australia)
                            </SelectItem>
                            <SelectItem value="+33" disabled>
                              +33 (France)
                            </SelectItem>
                            <SelectItem value="+49" disabled>
                              +49 (Germany)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        inputMode="numeric"
                        placeholder="(555) 555-5555"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        maxLength={14}
                        disabled={isLoading}
                      />
                    </div>
                    {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="utc-8">
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc-8">UTC-08:00 (Pacific Time)</SelectItem>
                        <SelectItem value="utc-7">UTC-07:00 (Mountain Time)</SelectItem>
                        <SelectItem value="utc-6">UTC-06:00 (Central Time)</SelectItem>
                        <SelectItem value="utc-5">UTC-05:00 (Eastern Time)</SelectItem>
                        <SelectItem value="utc">UTC+00:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email notifications</p>
                    </div>
                    <Switch id="notifications" defaultChecked />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveGeneralSettings} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Starlis Forwarding Email</CardTitle>
                  <CardDescription>Your unique email address for AI email processing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Your Starlis Forwarding Email</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This is your unique Starlis email address. Forward emails to this address to have them processed
                        by your AI assistant.
                      </p>
                      <div className="flex items-center space-x-2">
                        <Input value={starlisEmail} readOnly className="font-mono" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(starlisEmail)}>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy email address</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <h4 className="font-medium">Regenerate Email Address</h4>
                      <p className="text-sm text-muted-foreground">Create a new unique forwarding email address</p>
                    </div>
                    <Button variant="outline" onClick={() => setShowRegenerateWarningModal(true)}>
                      Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <CardTitle>Calendar Settings</CardTitle>
                  </div>
                  <CardDescription>Configure how your AI assistant manages your calendar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-meeting-duration">Default Meeting Duration (minutes)</Label>
                      <Select value={defaultMeetingDuration} onValueChange={setDefaultMeetingDuration}>
                        <SelectTrigger id="default-meeting-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Default duration when scheduling new meetings</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buffer-time">Buffer Time (minutes)</Label>
                      <Select value={bufferTime} onValueChange={setBufferTime}>
                        <SelectTrigger id="buffer-time">
                          <SelectValue placeholder="Select buffer time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No buffer</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Time to leave between consecutive meetings</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="working-hours-start">Working Hours Start</Label>
                      <Input
                        id="working-hours-start"
                        type="time"
                        value={workingHoursStart}
                        onChange={(e) => setWorkingHoursStart(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="working-hours-end">Working Hours End</Label>
                      <Input
                        id="working-hours-end"
                        type="time"
                        value={workingHoursEnd}
                        onChange={(e) => setWorkingHoursEnd(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>Working Days</Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={workingDays.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleWorkingDay(day)}
                          className="capitalize"
                        >
                          {day.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">Days when meetings can be scheduled</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-accept">Auto-Accept Meetings</Label>
                      <p className="text-sm text-muted-foreground">Automatically accept meeting invitations</p>
                    </div>
                    <Switch id="auto-accept" checked={autoAcceptMeetings} onCheckedChange={setAutoAcceptMeetings} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveCalendarSettings} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Calendar Settings"}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <CardTitle>Handling Settings</CardTitle>
                  </div>
                  <CardDescription>Configure how your AI assistant handles tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-reply">Auto-Reply to Emails</Label>
                      <p className="text-sm text-muted-foreground">Allow AI to automatically reply to emails</p>
                    </div>
                    <Switch id="auto-reply" checked={autoReplyToEmails} onCheckedChange={setAutoReplyToEmails} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-schedule">Auto-Schedule Meetings</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow AI to schedule meetings without confirmation
                      </p>
                    </div>
                    <Switch
                      id="auto-schedule"
                      checked={autoScheduleMeetings}
                      onCheckedChange={setAutoScheduleMeetings}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-suggest">Auto-Suggest Meeting Times</Label>
                      <p className="text-sm text-muted-foreground">Allow AI to suggest available meeting times</p>
                    </div>
                    <Switch id="auto-suggest" checked={autoSuggestTimes} onCheckedChange={setAutoSuggestTimes} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="confirm-before-sending">Confirm Before Sending</Label>
                      <p className="text-sm text-muted-foreground">Require confirmation before sending emails</p>
                    </div>
                    <Switch
                      id="confirm-before-sending"
                      checked={confirmBeforeSending}
                      onCheckedChange={setConfirmBeforeSending}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="email-response-style">Email Response Style</Label>
                    <Select value={emailResponseStyle} onValueChange={setEmailResponseStyle}>
                      <SelectTrigger id="email-response-style">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Preferred tone for AI-generated email responses</p>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label htmlFor="email-response-mode">How to Respond to Emails</Label>
                    <Select value={emailResponseMode} onValueChange={setEmailResponseMode}>
                      <SelectTrigger id="email-response-mode">
                        <SelectValue placeholder="Select response mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assistant">As Assistant (from Starlis forwarding email)</SelectItem>
                        <SelectItem value="user">As You (from your email)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose whether emails are sent from the assistant's perspective or your own
                    </p>
                  </div>

                  <div className="pt-4 space-y-4">
                    <h3 className="text-sm font-medium">Call Handling</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allow-call-forwarding">Allow Call Forwarding</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow assistant to forward calls to your number when requested
                        </p>
                      </div>
                      <Switch
                        id="allow-call-forwarding"
                        checked={allowCallForwarding}
                        onCheckedChange={setAllowCallForwarding}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="require-call-confirmation">Require Call Confirmation</Label>
                        <p className="text-sm text-muted-foreground">
                          Require your confirmation before initiating any calls
                        </p>
                      </div>
                      <Switch
                        id="require-call-confirmation"
                        checked={requireCallConfirmation}
                        onCheckedChange={setRequireCallConfirmation}
                      />
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Label htmlFor="startup-page">Default Startup Page</Label>
                    <Select value={startupPage} onValueChange={setStartupPage}>
                      <SelectTrigger id="startup-page">
                        <SelectValue placeholder="Select startup page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="new-chat">New Chat</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Choose which page to show when you sign in</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveHandlingSettings} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Handling Settings"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Manage Account Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Manage Account</CardTitle>
                  <CardDescription>Export or delete your account data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Download className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Export All Data</h4>
                        <p className="text-sm text-muted-foreground">Download a copy of your account data</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleExportData}>
                      Export Data
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <h4 className="font-medium">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="assistant" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assistant Settings</CardTitle>
                  <CardDescription>Configure your AI assistant's behavior and personality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assistant-name">Assistant Name</Label>
                    <Input
                      id="assistant-name"
                      placeholder="Starlis"
                      value={assistantName}
                      onChange={(e) => setAssistantName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      This name will be used when the assistant refers to itself
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-instructions">Custom Instructions</Label>
                    <textarea
                      id="custom-instructions"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="You are Starlis, a helpful assistant designed to manage emails, schedule meetings, and boost productivity."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      This prompt defines how the AI assistant behaves and responds
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personality">Personality</Label>
                    <Input
                      id="personality"
                      placeholder="helpful and professional"
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Define the personality traits of your AI assistant
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveAssistantSettings} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    <CardTitle>Voice Assistant</CardTitle>
                  </div>
                  <CardDescription>Enable or disable voice responses from your AI assistant</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="voice-enabled">Enable Voice Responses</Label>
                      <p className="text-sm text-muted-foreground">Allow the assistant to respond with voice</p>
                    </div>
                    <Switch id="voice-enabled" checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
                  </div>

                  <div className="rounded-lg border p-4 mt-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L6.5 11H17.5L12 2Z" fill="#5E42D7" />
                          <path d="M17.5 22L12 13L6.5 22H17.5Z" fill="#10C4FF" />
                          <path d="M6.5 11L2 16.5L6.5 22V11Z" fill="#FF7D54" />
                          <path d="M17.5 11V22L22 16.5L17.5 11Z" fill="#FF7D54" />
                        </svg>
                        <h3 className="text-base font-medium">ElevenLabs Dashboard</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Configure your voice, create custom voices, and manage your ElevenLabs settings directly in
                        their dashboard.
                      </p>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open("https://elevenlabs.io/app", "_blank")}
                        >
                          Open ElevenLabs Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>

                  {!elevenLabsComplete && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>ElevenLabs not configured</AlertTitle>
                      <AlertDescription>
                        Voice features require ElevenLabs integration. Please
                        <Button
                          variant="link"
                          className="h-auto p-0 text-primary"
                          onClick={() => {
                            setActiveTab("integrations")
                            setTimeout(() => setShowVoiceModal(true), 100)
                          }}
                        >
                          configure ElevenLabs
                        </Button>
                        in the Integrations tab.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveVoiceSettings} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Settings"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="integrations" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>External Integrations</CardTitle>
                  <CardDescription>Connect your accounts to Starlis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Google Calendar Integration section */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
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
                      <div>
                        <h4 className="font-medium">Google Calendar</h4>
                        <p className="text-sm text-muted-foreground">
                          Connect your Google account to manage your calendar events
                        </p>
                      </div>
                    </div>
                    {integrations.googleCalendar ? (
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDisconnectIntegration("googleCalendar")}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => handleConnectIntegration("googleCalendar")}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/40 relative">
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10">
                      <Badge className="absolute top-2 right-2 bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 font-medium">
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 opacity-70">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" className="h-5 w-5">
                          <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                          <path fill="#f35325" d="M1 1h10v10H1z" />
                          <path fill="#81bc06" d="M12 1h10v10H12z" />
                          <path fill="#05a6f0" d="M1 12h10v10H1z" />
                          <path fill="#ffba08" d="M12 12h10v10H12z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Microsoft</h4>
                        <p className="text-sm text-muted-foreground">Microsoft integration is in development</p>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button variant="outline" disabled={true} className="opacity-60 cursor-not-allowed">
                              Connect
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Microsoft integration is coming soon!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>

              {/* Voice Integration (ElevenLabs & Twilio) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    <CardTitle>Voice Integration</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your ElevenLabs and Twilio settings for voice capabilities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${twilioComplete && elevenLabsComplete ? "bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400"}`}
                          >
                            {twilioComplete && elevenLabsComplete ? "Connected" : "Partially Connected"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {twilioComplete && elevenLabsComplete
                              ? "Voice assistant is active"
                              : "Configuration needed"}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            ElevenLabs: {elevenLabsComplete ? "✓" : "⚠️"}
                          </span>
                          <span className="text-xs text-muted-foreground">Twilio: {twilioComplete ? "✓" : "⚠️"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowVoiceModal(true)}>
                          Configure
                        </Button>
                        {(twilioComplete || elevenLabsComplete) && (
                          <Button variant="destructive" size="sm" onClick={() => setShowDeactivateVoiceModal(true)}>
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SMTP Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <CardTitle>SMTP</CardTitle>
                  </div>
                  <CardDescription>Configure your email sending service for notifications.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${smtpSettings.smtpServer ? "bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400"}`}
                          >
                            {smtpSettings.smtpServer ? "Connected" : "Not Connected"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {smtpSettings.smtpServer ? `Using ${smtpSettings.smtpServer}` : "SMTP not configured"}
                          </span>
                        </div>
                        {smtpSettings.smtpServer && (
                          <span className="text-xs text-muted-foreground mt-1">{smtpSettings.smtpUsername}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowSmtpModal(true)}>
                          Configure
                        </Button>
                        {smtpSettings.smtpServer && (
                          <Button variant="destructive" size="sm" onClick={() => setShowDeactivateSmtpModal(true)}>
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="security" className="mt-4 space-y-4">
              <TwoFactorSetup />

              <Card>
                <CardHeader>
                  <CardTitle>Password Settings</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>

                  <Button>Update Password</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      {/* SMTP Settings Modal */}
      <Dialog open={showSmtpModal} onOpenChange={setShowSmtpModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{smtpSettings.smtpServer ? "Edit SMTP Settings" : "Connect SMTP"}</DialogTitle>
            <DialogDescription>
              Configure your SMTP settings to enable Starlis to send emails on your behalf.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-server">SMTP Server</Label>
              <Input
                id="smtp-server"
                name="smtpServer"
                placeholder="smtp.example.com"
                value={smtpFormData.smtpServer}
                onChange={handleSmtpInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-username">SMTP Username</Label>
                <Input
                  id="smtp-username"
                  name="smtpUsername"
                  placeholder="username@example.com"
                  value={smtpFormData.smtpUsername}
                  onChange={handleSmtpInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">SMTP Password</Label>
                <Input
                  id="smtp-password"
                  name="smtpPassword"
                  type="password"
                  placeholder={smtpSettings.smtpPassword ? "••••••••" : "Enter password"}
                  value={smtpFormData.smtpPassword}
                  onChange={handleSmtpInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  name="smtpPort"
                  placeholder="587"
                  value={smtpFormData.smtpPort}
                  onChange={handleSmtpInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-encryption">Encryption</Label>
                <Select
                  name="smtpEncryption"
                  value={smtpFormData.smtpEncryption}
                  onValueChange={(value) => setSmtpFormData((prev) => ({ ...prev, smtpEncryption: value }))}
                >
                  <SelectTrigger id="smtp-encryption">
                    <SelectValue placeholder="Select encryption" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ssl">SSL/TLS</SelectItem>
                    <SelectItem value="tls">STARTTLS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {smtpSettings.smtpServer && (
              <Button variant="destructive" onClick={handleDisconnectSmtp} disabled={isLoading}>
                Disconnect
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSmtpModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSmtpSettings} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Voice Integration Confirmation Modal */}
      <Dialog open={showDeactivateVoiceModal} onOpenChange={setShowDeactivateVoiceModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deactivate Voice Integration</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate your voice integration? This will remove all your ElevenLabs and
              Twilio settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-destructive font-medium">Warning:</p>
            <p className="text-sm text-muted-foreground mt-1">
              Deactivating will disable all voice capabilities in your Starlis assistant. You will need to reconfigure
              these settings to use voice features again.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateVoiceModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivateVoice} disabled={isLoading}>
              {isLoading ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate SMTP Confirmation Modal */}
      <Dialog open={showDeactivateSmtpModal} onOpenChange={setShowDeactivateSmtpModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deactivate SMTP Integration</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate your SMTP integration? This will remove all your email sending
              settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-destructive font-medium">Warning:</p>
            <p className="text-sm text-muted-foreground mt-1">
              Deactivating will disable email sending capabilities in your Starlis assistant. You will need to
              reconfigure these settings to use email features again.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateSmtpModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnectSmtp} disabled={isLoading}>
              {isLoading ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Data Modal */}
      {showExportModal && (
        <ExportDataModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} userEmail={email} />
      )}

      {/* Delete Account Flow */}
      {showDeleteAccountFlow && (
        <DeleteAccountFlow
          isOpen={showDeleteAccountFlow}
          onClose={() => setShowDeleteAccountFlow(false)}
          userEmail={email}
          has2FA={twoFactorEnabled}
        />
      )}

      {/* Voice Settings Modal */}
      <Dialog open={showVoiceModal} onOpenChange={setShowVoiceModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Voice Integration Settings</DialogTitle>
            <DialogDescription>Configure your ElevenLabs and Twilio settings for voice capabilities.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="elevenlabs" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="elevenlabs">ElevenLabs</TabsTrigger>
              <TabsTrigger value="twilio">Twilio</TabsTrigger>
            </TabsList>
            <TabsContent value="elevenlabs" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="elevenlabs-api-key">ElevenLabs API Key</Label>
                <Input
                  id="elevenlabs-api-key"
                  name="elevenLabsApiKey"
                  placeholder="Enter your ElevenLabs API key"
                  value={elevenLabsFormData.elevenLabsApiKey}
                  onChange={handleElevenLabsInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="elevenlabs-agent-id">ElevenLabs Agent ID</Label>
                <Input
                  id="elevenlabs-agent-id"
                  name="elevenLabsAgentId"
                  placeholder="Enter your ElevenLabs Agent ID"
                  value={elevenLabsFormData.elevenLabsAgentId}
                  onChange={handleElevenLabsInputChange}
                />
              </div>
              <Button onClick={handleSaveElevenLabsSettings} disabled={isLoading} className="w-full">
                {isLoading ? "Saving..." : "Save ElevenLabs Settings"}
              </Button>
            </TabsContent>
            <TabsContent value="twilio" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="twilio-sid">Twilio SID</Label>
                <Input
                  id="twilio-sid"
                  name="twilioSid"
                  placeholder="Enter your Twilio SID"
                  value={twilioFormData.twilioSid}
                  onChange={handleTwilioInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio-api-key">Twilio API Key</Label>
                <Input
                  id="twilio-api-key"
                  name="twilioApiKey"
                  placeholder="Enter your Twilio API Key"
                  value={twilioFormData.twilioApiKey}
                  onChange={handleTwilioInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio-phone-number">Twilio Phone Number</Label>
                <Input
                  id="twilio-phone-number"
                  name="twilioPhoneNumber"
                  placeholder="+1234567890"
                  value={twilioFormData.twilioPhoneNumber}
                  onChange={handleTwilioInputChange}
                />
              </div>
              <Button onClick={handleSaveTwilioSettings} disabled={isLoading} className="w-full">
                {isLoading ? "Saving..." : "Save Twilio Settings"}
              </Button>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoiceModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Email Warning Modal */}
      <Dialog open={showRegenerateWarningModal} onOpenChange={setShowRegenerateWarningModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Regenerate Forwarding Email</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate your Starlis forwarding email address?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="border-yellow-500">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Regenerating your email address will require you to reconfigure your email client to forward emails to
                the new address. Any emails sent to the old address will no longer be processed.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateWarningModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowRegenerateWarningModal(false)
                setShowPasswordConfirmModal(true)
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Confirmation Modal */}
      <Dialog open={showPasswordConfirmModal} onOpenChange={setShowPasswordConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Your Password</DialogTitle>
            <DialogDescription>Please enter your password to confirm this action.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {regenerateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{regenerateError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="regenerate-password">Password</Label>
              <Input
                id="regenerate-password"
                type="password"
                value={regeneratePassword}
                onChange={(e) => setRegeneratePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordConfirmModal(false)
                setRegeneratePassword("")
                setRegenerateError(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRegenerateEmailWithPassword} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Regenerate Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

