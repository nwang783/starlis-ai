"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import {
  generateOTPSecret,
  generateQRCode,
  verifyTOTP,
  enable2FA,
  disable2FA,
  generateRecoveryCodes,
  get2FAStatus,
} from "@/lib/2fa"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  Copy,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  AlertTriangle,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function TwoFactorSetup() {
  const { user, refreshUserData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showRecoveryCodesDialog, setShowRecoveryCodesDialog] = useState(false)
  const [setupStep, setSetupStep] = useState(1)
  const [secret, setSecret] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationError, setVerificationError] = useState("")
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [disableCode, setDisableCode] = useState("")
  const [disableError, setDisableError] = useState("")
  const [recoveryCodesRemaining, setRecoveryCodesRemaining] = useState(0)

  // Fetch 2FA status
  const fetchTwoFactorStatus = async () => {
    if (!user) return

    try {
      const status = await get2FAStatus(user.uid)
      setIsTwoFactorEnabled(status.enabled)
      setRecoveryCodesRemaining(status.recoveryCodesRemaining)
    } catch (error) {
      console.error("Error fetching 2FA status:", error)
    }
  }

  useEffect(() => {
    fetchTwoFactorStatus()
  }, [user])

  // Start 2FA setup
  const handleStartSetup = async () => {
    if (!user) return

    setIsLoading(true)
    setSetupStep(1)
    setVerificationCode("")
    setVerificationError("")

    try {
      const newSecret = await generateOTPSecret(user.uid, user.email || "user@example.com")
      setSecret(newSecret)

      const qrCode = await generateQRCode(newSecret, user.email || "user@example.com")
      setQrCodeUrl(qrCode)

      setShowSetupDialog(true)
    } catch (error) {
      console.error("Error starting 2FA setup:", error)
      toast({
        title: "Error",
        description: "Failed to start 2FA setup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Verify setup code
  const handleVerifySetupCode = async () => {
    if (!user || !secret) return

    setIsLoading(true)
    setVerificationError("")

    try {
      const isValid = verifyTOTP(secret, verificationCode)

      if (!isValid) {
        setVerificationError("Invalid verification code. Please try again.")
        setIsLoading(false)
        return
      }

      // Generate recovery codes
      const codes = await generateRecoveryCodes(user.uid)
      setRecoveryCodes(codes)

      // Enable 2FA
      await enable2FA(user.uid)

      // Update local state
      setIsTwoFactorEnabled(true)
      setRecoveryCodesRemaining(codes.length)

      // Move to next step to show recovery codes
      setSetupStep(2)

      // Refresh user data in context
      await refreshUserData()
    } catch (error) {
      console.error("Error verifying setup code:", error)
      setVerificationError("An error occurred during verification. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Complete setup
  const handleCompleteSetup = () => {
    setShowSetupDialog(false)
    toast({
      title: "Two-Factor Authentication Enabled",
      description: "Your account is now more secure with 2FA.",
    })
  }

  // Show recovery codes
  const handleShowRecoveryCodes = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      const status = await get2FAStatus(user.uid)
      setRecoveryCodes(status.recoveryCodes)
      setShowRecoveryCodesDialog(true)
    } catch (error) {
      console.error("Error fetching recovery codes:", error)
      toast({
        title: "Error",
        description: "Failed to fetch recovery codes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Start disable 2FA
  const handleStartDisable = () => {
    setDisableCode("")
    setDisableError("")
    setShowDisableDialog(true)
  }

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!user || !disableCode) return

    setIsLoading(true)
    setDisableError("")

    try {
      // Get the current secret
      const status = await get2FAStatus(user.uid)

      // Verify the code
      const isValid = verifyTOTP(status.secret, disableCode)

      if (!isValid) {
        toast({
          title: "Invalid code",
          description: "Please check your authenticator app and try again.",
          variant: "destructive",
        })
        return
      }

      // Disable 2FA
      await disable2FA(user.uid)

      // Update local state
      setIsTwoFactorEnabled(false)
      setRecoveryCodesRemaining(0)

      // Close dialog
      setShowDisableDialog(false)

      // Refresh user data in context
      await refreshUserData()

      toast({
        title: "Two-Factor Authentication Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      })
    } catch (error) {
      console.error("Error disabling 2FA:", error)
      setDisableError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Copy recovery code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Recovery code copied to clipboard.",
    })
  }

  // Copy all recovery codes to clipboard
  const copyAllCodesToClipboard = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"))
    toast({
      title: "Copied to clipboard",
      description: "All recovery codes copied to clipboard.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground">
              {isTwoFactorEnabled
                ? "Two-factor authentication is enabled for your account."
                : "Protect your account with two-factor authentication."}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {isTwoFactorEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowRecoveryCodes}
                disabled={isLoading}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                View Recovery Codes
              </Button>
            )}
            <Button
              variant={isTwoFactorEnabled ? "destructive" : "default"}
              size="sm"
              onClick={isTwoFactorEnabled ? handleStartDisable : handleStartSetup}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isTwoFactorEnabled ? (
                <ShieldOff className="mr-2 h-4 w-4" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {isTwoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {setupStep === 1
                ? "Scan the QR code with your authenticator app and enter the verification code."
                : "Save these recovery codes in a secure place. You won't be able to see them again."}
            </DialogDescription>
          </DialogHeader>
          {setupStep === 1 ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  disabled={isLoading}
                />
                {verificationError && (
                  <p className="text-sm text-destructive">{verificationError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleVerifySetupCode}
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Verify and Enable
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Save Your Recovery Codes</AlertTitle>
                <AlertDescription>
                  These codes can be used to access your account if you lose your authenticator device.
                  Store them in a secure place.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <code className="text-sm">{code}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={copyAllCodesToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </Button>
                <Button onClick={handleCompleteSetup}>I've Saved These</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the verification code from your authenticator app to disable 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disableCode">Verification Code</Label>
              <Input
                id="disableCode"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={isLoading}
              />
              {disableError && (
                <p className="text-sm text-destructive">{disableError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleDisable2FA}
                disabled={isLoading || disableCode.length !== 6}
                variant="destructive"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Disable 2FA
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      <Dialog open={showRecoveryCodesDialog} onOpenChange={setShowRecoveryCodesDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recovery Codes</DialogTitle>
            <DialogDescription>
              You have {recoveryCodesRemaining} recovery codes remaining. Generate new codes if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Save Your Recovery Codes</AlertTitle>
              <AlertDescription>
                These codes can be used to access your account if you lose your authenticator device.
                Store them in a secure place.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <code className="text-sm">{code}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={copyAllCodesToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy All
              </Button>
              <Button
                variant="outline"
                onClick={handleStartSetup}
                disabled={isLoading}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Generate New Codes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

