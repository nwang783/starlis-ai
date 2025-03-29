"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  generateOTPSecret,
  generateQRCode,
  verifyTOTP,
  enable2FA,
  disable2FA,
  generateRecoveryCodes,
  get2FAStatus,
} from "@/lib/2fa"

export function TwoFactorSetup() {
  const { user, refreshUserData } = useAuth()
  const { toast } = useToast()
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
        setDisableError("Invalid verification code. Please try again.")
        setIsLoading(false)
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
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="2fa" className="text-base">Two-Factor Authentication</Label>
              {isTwoFactorEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : (
                <ShieldOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isTwoFactorEnabled
                ? "Your account is protected with two-factor authentication."
                : "Protect your account with an authenticator app for an extra layer of security."\
            </p>
          </div>
          <Switch
            id="2fa"
            checked={isTwoFactorEnabled}
            onCheckedChange={(checked) => {
              if (checked) {
                handleStartSetup()
              } else {
                handleStartDisable()
              }
            }}
          />
        </div>

        {isTwoFactorEnabled && (
          <>
            <Alert className="mt-4">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Two-Factor Authentication is Enabled</AlertTitle>
              <AlertDescription>
                You have {recoveryCodesRemaining} recovery codes remaining. Save these codes in a safe place to prevent being locked out of your account.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2 mt-4">
              <Button variant="outline" onClick={handleShowRecoveryCodes}>
                <KeyRound className="mr-2 h-4 w-4" />
                View Recovery Codes
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* 2FA Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {setupStep === 1
                ? "Scan the QR code with your authenticator app and enter the verification code."
                : "Save your recovery codes in a safe place."}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 1 ? (
            <>
              <div className="flex flex-col items-center space-y-4 py-4">
                <div className="bg-white p-2 rounded-lg">
                  {qrCodeUrl && (
                    <img 
                      src={qrCodeUrl || "/placeholder.svg"} 
                      alt="QR Code" 
                      className="w-48 h-48" 
                    />
                  )}
                </div>
                
                <div className="w-full space-y-2">
                  <Label htmlFor="secret">Secret Key (Manual Entry)</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="secret" 
                      value={secret} 
                      readOnly 
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        navigator.clipboard.writeText(secret)
                        toast({
                          title: "Copied",
                          description: "Secret key copied to clipboard",
                        })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If you can't scan the QR code, enter this secret key manually in your authenticator app.
                  </p>
                </div>
                
                <div className="w-full space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      if (value.length <= 6) setVerificationCode(value)
                    }}
                    className="font-mono text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                
                {verificationError && (
                  <Alert variant="destructive" className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{verificationError}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSetupDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleVerifySetupCode} 
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex flex-col space-y-4 py-4">
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    These recovery codes will only be shown once. Save them in a secure location. Each code can only be used once.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-muted rounded-lg p-4 grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <code className="font-mono text-sm">{code}</code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => copyToClipboard(code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={copyAllCodesToClipboard}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All Codes
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={handleCompleteSetup}>
                  Complete Setup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      <Dialog open={showRecoveryCodesDialog} onOpenChange={setShowRecoveryCodesDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Your Recovery Codes</DialogTitle>
            <DialogDescription>
              Each code can only be used once. Keep these codes in a safe place.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                If you lose your authenticator device, you can use these codes to regain access to your account.
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted rounded-lg p-4 grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between">
                  <code className="font-mono text-sm">{code}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => copyToClipboard(code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={copyAllCodesToClipboard}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy All Codes
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowRecoveryCodesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the verification code from your authenticator app to disable 2FA.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Disabling two-factor authentication will make your account less secure. Only proceed if absolutely necessary.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="disableCode">Verification Code</Label>
              <Input
                id="disableCode"
                placeholder="123456"
                value={disableCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  if (value.length <= 6) setDisableCode(value)
                }}
                className="font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
            
            {disableError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{disableError}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDisableDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisable2FA} 
              disabled={isLoading || disableCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

