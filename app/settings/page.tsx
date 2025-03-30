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
import { AlertCircle, Calendar, Download, Trash2, Mic, Mail } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  updateUserData,
  updateSmtpSettings,
  updateIntegrationSettings,
  regenerateStarlisEmail,
  toggle2FA,
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

import { TwoFactorSetup } from "@/components/two-factor-setup"
import { ExportDataModal } from "@/components/export-data-modal"
import { DeleteAccountFlow } from "@/components/delete-account-flow"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

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
    smtpServer: process.env.SMTP_SERVER || "",
    smtpUsername: process.env.SMTP_USERNAME || "",
    smtpPassword: process.env.SMTP_PASSWORD || "",
    smtpPort: process.env.SMTP_PORT || "",
    smtpEncryption: process.env.SMTP_ENCRYPTION || "tls",
  })

  // Add state variables for Twilio and ElevenLabs form data
  const [twilioFormData, setTwilioFormData] = useState({
    twilioSid: process.env.TWILIO_SID || "",
    twilioApiKey: process.env.TWILIO_API_KEY || "",
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  })

  const [elevenLabsFormData, setElevenLabsFormData] = useState({
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || "",
    elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID || "",
  })

  // Add state variables to track completion status
  const [twilioComplete, setTwilioComplete] = useState(false)
  const [elevenLabsComplete, setElevenLabsComplete] = useState(false)

  // Add state for export data and delete account modals
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteAccountFlow, setShowDeleteAccountFlow] = useState(false)

  // Add state variables for assistant settings
  const [assistantName, setAssistantName] = useState("Starlis")
  const [systemPrompt, setSystemPrompt] = useState(
    "You are Starlis, a helpful assistant designed to manage emails, schedule meetings, and boost productivity. You are professional, efficient, and friendly. You help users manage their time, respond to emails, and organize their schedule.",
  )
  const [temperature, setTemperature] = useState("0.7")

  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneError, setPhoneError] = useState("")

  // Add a new state variable for the voice settings modal
  const [showVoiceModal, setShowVoiceModal] = useState(false)

  // Add state for deactivation confirmation modals
  const [showDeactivateVoiceModal, setShowDeactivateVoiceModal] = useState(false)
  const [showDeactivateSmtpModal, setShowDeactivateSmtpModal] = useState(false)

  // Initialize form data from userData
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "")
      setLastName(userData.lastName || "")
      setEmail(userData.email || "")
      setStarlisEmail(userData.starlisForwardingEmail || "")
      setSmtpSettings({
        smtpUsername: userData.smtpUsername || "",
        smtpPassword: userData.smtpPassword || "",
        smtpPort: userData.smtpPort || "",
        smtpServer: userData.smtpServer || "",
        smtpEncryption: userData.smtpEncryption || "tls",
      })
      setIntegrations(
        userData.integrations || {
          googleCalendar: false,
          outlookCalendar: false,
          appleCalendar: false,
          gmail: false,
          discord: false,
          twitter: false,
        },
      )
      setTwoFactorEnabled(userData.twoFactorEnabled || false)

      // Initialize Twilio form data
      setTwilioFormData({
        twilioSid: userData.onboarding?.voice?.twilioSid || "",
        twilioApiKey: userData.onboarding?.voice?.twilioApiKey || "",
        twilioPhoneNumber: userData.onboarding?.voice?.twilioPhoneNumber || "",
      })

      // Initialize ElevenLabs form data
      setElevenLabsFormData({
        elevenLabsApiKey: userData.onboarding?.voice?.elevenLabsApiKey || "",
        elevenLabsAgentId: userData.onboarding?.voice?.elevenLabsAgentId || "",
      })

      // Check if credentials are complete
      setTwilioComplete(
        !!userData.onboarding?.voice?.twilioSid &&
          !!userData.onboarding?.voice?.twilioApiKey &&
          !!userData.onboarding?.voice?.twilioPhoneNumber,
      )

      setElevenLabsComplete(
        !!userData.onboarding?.voice?.elevenLabsApiKey &&
          !!userData.onboarding?.voice?.elevenLabsAgentId,
      )

      // Initialize assistant settings from userData
      setAssistantName(userData.assistant?.name || "Starlis")
      setSystemPrompt(
        userData.assistant?.systemPrompt ||
          "You are Starlis, a helpful assistant designed to manage emails, schedule meetings, and boost productivity. You are professional, efficient, and friendly. You help users manage their time, respond to emails, and organize their schedule.",
      )
      setTemperature(userData.assistant?.temperature || "0.7")

      setPhoneNumber(userData.phoneNumber ? formatPhoneNumber(userData.phoneNumber.replace(/^\+1/, "")) : "")
    }
  }, [userData])

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

  const handleRegenerateStarlisEmail = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const newEmail = await regenerateStarlisEmail(user.uid, firstName, lastName)
      setStarlisEmail(newEmail)

      await refreshUserData()

      toast({
        title: "Email regenerated",
        description: "Your Starlis forwarding email has been regenerated successfully.",
      })
    } catch (error) {
      console.error("Error regenerating email:", error)
      toast({
        title: "Error",
        description: "Failed to regenerate email. Please try again.",
        variant: "destructive",
      })
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

  const handleConnectIntegration = async (integration: string) => {
    if (!user) return

    setIsLoading(true)
    try {
      // In a real app, this would open OAuth flow
      const updatedIntegrations = {
        ...integrations,
        [integration]: true,
      }

      await updateIntegrationSettings(user.uid, updatedIntegrations)
      setIntegrations(updatedIntegrations)

      await refreshUserData()

      toast({
        title: "Integration connected",
        description: `${integration} has been connected successfully.`,
      })
    } catch (error) {
      console.error("Error connecting integration:", error)
      toast({
        title: "Error",
        description: "Failed to connect integration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new handler function for disconnecting integrations after the handleConnectIntegration function

  const handleDisconnectIntegration = async (integration: string) => {
    if (!user) return

    setIsLoading(true)
    try {
      // Update the integrations object
      const updatedIntegrations = {
        ...integrations,
        [integration]: false,
      }

      await updateIntegrationSettings(user.uid, updatedIntegrations)
      setIntegrations(updatedIntegrations)

      await refreshUserData()

      toast({
        title: "Integration disconnected",
        description: `${integration} has been disconnected successfully.`,
      })
    } catch (error) {
      console.error("Error disconnecting integration:", error)
      toast({
        title: "Error",
        description: "Failed to disconnect integration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
    if (!user) return

    setIsLoading(true)
    try {
      await updateUserData(user.uid, {
        assistant: {
          name: assistantName,
          systemPrompt: systemPrompt,
          temperature: temperature,
        },
      })

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
                    <Label htmlFor="system-prompt">System Prompt</Label>
                    <textarea
                      id="system-prompt"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="You are Starlis, a helpful assistant designed to manage emails, schedule meetings, and boost productivity."
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      This prompt defines how the AI assistant behaves and responds
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">Response Creativity</Label>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">Precise</span>
                      <Input
                        id="temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">Creative</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Adjust how creative or precise the assistant's responses should be
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveAssistantSettings} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="integrations" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar Integrations</CardTitle>
                  <CardDescription>Connect your calendars to Starlis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Find this section in the Calendar Integrations card: */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Google Calendar</h4>
                        <p className="text-sm text-muted-foreground">Sync your Google Calendar events</p>
                      </div>
                    </div>
                    {integrations.googleCalendar ? (
                      <div className="flex gap-2 items-center">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-900/30 dark:text-green-400"
                        >
                          Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectIntegration("googleCalendar")}
                          disabled={isLoading}
                          className="text-destructive border-destructive hover:bg-destructive/10"
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleConnectIntegration("googleCalendar")}
                        disabled={isLoading}
                      >
                        Connect
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
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Microsoft Outlook</h4>
                        <p className="text-sm text-muted-foreground">Outlook Calendar integration is in development</p>
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
                          <p>Outlook Calendar integration is coming soon!</p>
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
    </SidebarProvider>
  )
}

