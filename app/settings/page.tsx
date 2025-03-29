"use client"

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
import { AlertCircle, Calendar, Copy, Mail, RefreshCw, Shield } from "lucide-react"
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

export default function SettingsPage() {
  const { userData, user, refreshUserData } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
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

  // Initialize form data from userData
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "")
      setLastName(userData.lastName || "")
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

  const handleSaveSmtpSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await updateSmtpSettings(user.uid, smtpSettings)

      await refreshUserData()

      toast({
        title: "SMTP settings updated",
        description: "Your mail settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Error updating SMTP settings:", error)
      toast({
        title: "Error",
        description: "Failed to update SMTP settings. Please try again.",
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
                  <BreadcrumbPage>Settings</BreadcrumbPage>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
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
                    <Input id="email" value={starlisEmail} disabled className="bg-muted" />
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

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar Integrations</CardTitle>
                  <CardDescription>Connect your calendars to Starlis AI</CardDescription>
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

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Apple Calendar</h4>
                        <p className="text-sm text-muted-foreground">Sync your Apple Calendar events</p>
                      </div>
                    </div>
                    <Button
                      variant={integrations.appleCalendar ? "default" : "outline"}
                      onClick={() => handleConnectIntegration("appleCalendar")}
                      disabled={isLoading || integrations.appleCalendar}
                    >
                      {integrations.appleCalendar ? "Connected" : "Connect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Other Integrations</CardTitle>
                  <CardDescription>Connect other services to enhance Starlis AI</CardDescription>
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
                        <svg
                          className="h-5 w-5 text-primary"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Discord</h4>
                        <p className="text-sm text-muted-foreground">Connect your Discord account</p>
                      </div>
                    </div>
                    <Button
                      variant={integrations.discord ? "default" : "outline"}
                      onClick={() => handleConnectIntegration("discord")}
                      disabled={isLoading || integrations.discord}
                    >
                      {integrations.discord ? "Connected" : "Connect"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <svg
                          className="h-5 w-5 text-primary"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M22.2125 5.65605C21.4491 5.99375 20.6395 6.21555 19.8106 6.31411C20.6839 5.79132 21.3374 4.9689 21.6493 4.00005C20.8287 4.48761 19.9305 4.83077 18.9938 5.01461C18.2031 4.17106 17.098 3.69303 15.9418 3.69434C13.6326 3.69434 11.7597 5.56661 11.7597 7.87683C11.7597 8.20458 11.7973 8.52242 11.8676 8.82909C8.39047 8.65404 5.31007 6.99005 3.24678 4.45941C2.87529 5.09767 2.68005 5.82318 2.68104 6.56167C2.68104 8.01259 3.4196 9.29324 4.54149 10.043C3.87737 10.022 3.22788 9.84264 2.64718 9.51973C2.64654 9.5373 2.64654 9.55487 2.64654 9.57148C2.64654 11.5984 4.08819 13.2892 6.00199 13.6731C5.64211 13.7703 5.27175 13.8194 4.90023 13.8191C4.62997 13.8191 4.36718 13.7942 4.11149 13.7453C4.64687 15.4065 6.18851 16.6159 8.0197 16.6491C6.53465 17.8118 4.70545 18.4426 2.82446 18.4399C2.49339 18.4399 2.1692 18.4209 1.84961 18.3831C3.69308 19.6102 5.85646 20.2625 8.11811 20.2591C15.9316 20.2591 20.1987 13.8866 20.1987 8.36101C20.1987 8.1803 20.1941 7.99771 20.186 7.81789C21.0141 7.22489 21.7383 6.49211 22.31 5.65708L22.2125 5.65605Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Twitter</h4>
                        <p className="text-sm text-muted-foreground">Connect your Twitter account</p>
                      </div>
                    </div>
                    <Button
                      variant={integrations.twitter ? "default" : "outline"}
                      onClick={() => handleConnectIntegration("twitter")}
                      disabled={isLoading || integrations.twitter}
                    >
                      {integrations.twitter ? "Connected" : "Connect"}
                    </Button>
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
                      Forward your emails to this address to have them processed by Starlis AI.
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
                        value={smtpSettings.smtpServer}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpServer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input
                        id="smtp-port"
                        placeholder="587"
                        value={smtpSettings.smtpPort}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpPort: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">SMTP Username</Label>
                      <Input
                        id="smtp-username"
                        placeholder="username@example.com"
                        value={smtpSettings.smtpUsername}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpUsername: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">SMTP Password</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        placeholder="••••••••"
                        value={smtpSettings.smtpPassword}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtpPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="smtp-encryption">Encryption</Label>
                      <Select
                        value={smtpSettings.smtpEncryption}
                        onValueChange={(value) => setSmtpSettings({ ...smtpSettings, smtpEncryption: value })}
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
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="2fa">Two-Factor Authentication</Label>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      id="2fa"
                      checked={twoFactorEnabled}
                      onCheckedChange={handleToggle2FA}
                      disabled={isLoading}
                    />
                  </div>

                  <Separator />

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
    </SidebarProvider>
  )
}

