"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "../../components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Calendar, Copy, Mail, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Settings2 } from "lucide-react"

import { TwoFactorSetup } from "@/components/two-factor-setup"

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
    }
  }, [userData])

  // Set active tab from URL parameter
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleSaveGeneralSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await updateUserData(user.uid, {
        firstName,
        lastName,
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Starlis Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
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
                    <Input id="assistant-name" placeholder="Starlis" defaultValue="Starlis" />
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
                      defaultValue="You are Starlis, a helpful assistant designed to manage emails, schedule meetings, and boost productivity. You are professional, efficient, and friendly. You help users manage their time, respond to emails, and organize their schedule."
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
                        defaultValue="0.7"
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
                  <Button>Save Changes</Button>
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
                    <Button
                      variant={integrations.googleCalendar ? "default" : "outline"}
                      onClick={() => handleConnectIntegration("googleCalendar")}
                      disabled={isLoading || integrations.googleCalendar}
                    >
                      {integrations.googleCalendar ? "Connected" : "Connect"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Microsoft Outlook</h4>
                        <p className="text-sm text-muted-foreground">Sync your Outlook calendar events</p>
                      </div>
                    </div>
                    <Button
                      variant={integrations.outlookCalendar ? "default" : "outline"}
                      onClick={() => handleConnectIntegration("outlookCalendar")}
                      disabled={isLoading || integrations.outlookCalendar}
                    >
                      {integrations.outlookCalendar ? "Connected" : "Connect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Voice Integrations</CardTitle>
                  <CardDescription>Configure voice services to enable phone calls and voice responses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <svg className="h-6 w-6 text-[#F22F46]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.8,13.75a1,1,0,0,0-1.39.26,1.24,1.24,0,0,1-1,.53,1.29,1.29,0,0,1-1-.53l-4.94-6.69a3.26,3.26,0,0,0-2.62-1.32,3.23,3.23,0,0,0-2.61,1.32L1.59,11.45a.92.92,0,0,0,.16,1.31.94.94,0,0,0,1.31-.15L5.7,8.48a1.29,1.29,0,0,1,1-.53,1.29,1.29,0,0,1,1,.53L12.7,15.17a3.21,3.21,0,0,0,2.61,1.32,3.2,3.2,0,0,0,2.62-1.32l2.13-2.89A1,1,0,0,0,17.8,13.75Z" />
                            <path d="M17.25,0H6.75A2.75,2.75,0,0,0,4,2.75v18.5A2.75,2.75,0,0,0,6.75,24h10.5A2.75,2.75,0,0,0,20,21.25V2.75A2.75,2.75,0,0,0,17.25,0ZM12,22a1.25,1.25,0,1,1,1.25-1.25A1.25,1.25,0,0,1,12,22Z" />
                          </svg>
                          <h4 className="font-medium">Twilio Integration</h4>
                        </div>
                        <span className="text-xs font-medium text-amber-500">Incomplete</span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="twilioSid">Twilio Account SID</Label>
                          <Input id="twilioSid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="twilioApiKey">Twilio API Key</Label>
                          <Input id="twilioApiKey" placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="twilioPhoneNumber">Twilio Phone Number</Label>
                          <Input id="twilioPhoneNumber" placeholder="+1xxxxxxxxxx" />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button>Save Twilio Settings</Button>
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
                          <h4 className="font-medium">ElevenLabs Integration</h4>
                        </div>
                        <span className="text-xs font-medium text-amber-500">Incomplete</span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="elevenLabsApiKey">ElevenLabs API Key</Label>
                          <Input id="elevenLabsApiKey" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="elevenLabsAgentId">ElevenLabs Agent ID</Label>
                          <Input id="elevenLabsAgentId" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button>Save ElevenLabs Settings</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Other Integrations</CardTitle>
                  <CardDescription>Connect other services to enhance Starlis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Gmail</h4>
                        <p className="text-sm text-muted-foreground">Connect your Gmail account</p>
                      </div>
                    </div>
                    <Button
                      variant={integrations.gmail ? "default" : "outline"}
                      onClick={() => handleConnectIntegration("gmail")}
                      disabled={isLoading || integrations.gmail}
                    >
                      {integrations.gmail ? "Connected" : "Connect"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">SMTP</h4>
                        <p className="text-sm text-muted-foreground">Configure SMTP for sending emails</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {smtpSettings.smtpServer ? (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowSmtpModal(true)}
                            title="Edit SMTP Settings"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button variant="default" disabled>
                            Connected
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" onClick={() => setShowSmtpModal(true)}>
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Mail Settings Tab */}
            <TabsContent value="mail" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Forwarding</CardTitle>
                  <CardDescription>Manage your auto-generated email address for forwarding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Your Forwarding Email Address</AlertTitle>
                    <AlertDescription>
                      Forward your emails to this address to have them processed by Starlis.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center space-x-2">
                    <Input readOnly value={starlisEmail} className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      title="Copy to clipboard"
                      onClick={() => copyToClipboard(starlisEmail)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Regenerate email address"
                      onClick={handleRegenerateStarlisEmail}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    You can regenerate this email address if needed, but you'll need to update any forwarding rules
                    you've set up.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SMTP Settings</CardTitle>
                  <CardDescription>Configure your SMTP settings for sending emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-server">SMTP Server</Label>
                      <Input
                        id="smtp-server"
                        placeholder="smtp.example.com"
                        name="smtpServer"
                        value={smtpFormData.smtpServer}
                        onChange={handleSmtpInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input
                        id="smtp-port"
                        placeholder="587"
                        name="smtpPort"
                        value={smtpFormData.smtpPort}
                        onChange={handleSmtpInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">SMTP Username</Label>
                      <Input
                        id="smtp-username"
                        placeholder="username@example.com"
                        name="smtpUsername"
                        value={smtpFormData.smtpUsername}
                        onChange={handleSmtpInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">SMTP Password</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        placeholder="••••••••"
                        name="smtpPassword"
                        value={smtpFormData.smtpPassword}
                        onChange={handleSmtpInputChange}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="smtp-encryption">Encryption</Label>
                      <Select
                        value={smtpFormData.smtpEncryption}
                        onValueChange={(value) => setSmtpFormData({ ...smtpFormData, smtpEncryption: value })}
                      >
                        <SelectTrigger id="smtp-encryption">
                          <SelectValue placeholder="Select encryption" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Button onClick={handleSaveSmtpSettings} disabled={isLoading}>
                      {isLoading ? "Testing..." : "Test Connection"}
                    </Button>
                    <Button variant="outline" onClick={handleSaveSmtpSettings} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>IMAP/POP3 Settings</CardTitle>
                  <CardDescription>Configure your IMAP or POP3 settings for receiving emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mail-protocol">Protocol</Label>
                    <Select defaultValue="imap">
                      <SelectTrigger id="mail-protocol">
                        <SelectValue placeholder="Select protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imap">IMAP</SelectItem>
                        <SelectItem value="pop3">POP3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="imap-server">Server</Label>
                      <Input id="imap-server" placeholder="imap.example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap-port">Port</Label>
                      <Input id="imap-port" placeholder="993" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap-username">Username</Label>
                      <Input id="imap-username" placeholder="username@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap-password">Password</Label>
                      <Input id="imap-password" type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="imap-encryption">Encryption</Label>
                      <Select defaultValue="ssl">
                        <SelectTrigger id="imap-encryption">
                          <SelectValue placeholder="Select encryption" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Button>Test Connection</Button>
                    <Button variant="outline">Save Settings</Button>
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
    </SidebarProvider>
  )
}

