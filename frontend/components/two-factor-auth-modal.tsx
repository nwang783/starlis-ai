"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { verify2FALogin } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, KeyRound, RotateCcw } from "lucide-react"
import { getUserData } from "@/lib/firebase"

interface TwoFactorAuthModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TwoFactorAuthModal({ userId, isOpen, onClose, onSuccess }: TwoFactorAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [authCode, setAuthCode] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [error, setError] = useState("")
  const [tab, setTab] = useState("code")
  const [email, setEmail] = useState("")
  const router = useRouter()
  const codeInputRef = useRef<HTMLInputElement>(null)

  // Fetch user email for display
  useEffect(() => {
    if (userId) {
      const fetchUserData = async () => {
        try {
          const userData = await getUserData(userId)
          if (userData) {
            setEmail(userData.email)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }

      fetchUserData()
    }
  }, [userId])

  // Focus input field when modal opens
  useEffect(() => {
    if (isOpen && codeInputRef.current) {
      setTimeout(() => {
        codeInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, tab])

  const handleAuthCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (authCode.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await verify2FALogin(userId, authCode)
      onSuccess()
    } catch (err: any) {
      console.error("2FA verification error:", err)
      setError("Invalid verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecoveryCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (recoveryCode.length !== 10) {
      setError("Please enter a valid 10-digit recovery code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await verify2FALogin(userId, recoveryCode, true)
      onSuccess()
    } catch (err: any) {
      console.error("Recovery code verification error:", err)
      setError("Invalid recovery code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Please enter the verification code from your authenticator app to continue.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">Authentication Code</TabsTrigger>
            <TabsTrigger value="recovery">Recovery Code</TabsTrigger>
          </TabsList>

          <TabsContent value="code">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleAuthCodeSubmit}>
              <div className="flex flex-col space-y-4 py-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Enter the 6-digit code from your authenticator app for <strong>{email}</strong>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authCode">Authentication Code</Label>
                  <Input
                    ref={codeInputRef}
                    id="authCode"
                    placeholder="123456"
                    value={authCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "")
                      if (value.length <= 6) setAuthCode(value)
                    }}
                    className="font-mono text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Verify Code
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="recovery">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRecoveryCodeSubmit}>
              <div className="flex flex-col space-y-4 py-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Lost access to your authenticator app? Enter one of your 10-digit recovery codes.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recoveryCode">Recovery Code</Label>
                  <Input
                    id="recoveryCode"
                    placeholder="1234567890"
                    value={recoveryCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "")
                      if (value.length <= 10) setRecoveryCode(value)
                    }}
                    className="font-mono text-center text-lg tracking-widest"
                    maxLength={10}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Note: Recovery codes can only be used once. After using a recovery code, you'll need to set up 2FA
                  again.
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Use Recovery Code
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

