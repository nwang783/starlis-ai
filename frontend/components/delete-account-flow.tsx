"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { auth, deleteUserAccount, verifyPassword } from "@/lib/firebase"
import { TwoFactorAuthModal } from "./two-factor-auth-modal"

interface DeleteAccountFlowProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  has2FA: boolean
}

type FlowStep = "confirm" | "password" | "2fa" | "final-warning"

export function DeleteAccountFlow({ isOpen, onClose, userEmail, has2FA }: DeleteAccountFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>("confirm")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const router = useRouter()
  // Add state to store password for deletion
  const [passwordForDeletion, setPasswordForDeletion] = useState("")

  const resetFlow = () => {
    setCurrentStep("confirm")
    setPassword("")
    setError(null)
    setIsLoading(false)
    setShow2FAModal(false)
  }

  const handleClose = () => {
    resetFlow()
    onClose()
  }

  // Update the handlePasswordSubmit function to pass the password to deleteUserAccount
  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError("Please enter your password")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Verify the password
      await verifyPassword(password)

      // Store the password for later use during account deletion
      // We'll need it for re-authentication
      setPasswordForDeletion(password)

      // If 2FA is enabled, show the 2FA modal, otherwise go to final warning
      if (has2FA) {
        setCurrentStep("2fa")
        setShow2FAModal(true)
      } else {
        setCurrentStep("final-warning")
      }
    } catch (err: any) {
      console.error("Password verification error:", err)
      setError("Incorrect password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FASuccess = () => {
    setShow2FAModal(false)
    setCurrentStep("final-warning")
  }

  // Update the handleDeleteAccount function to use the stored password
  const handleDeleteAccount = async () => {
    setIsLoading(true)

    try {
      // Delete the user account, passing the password for re-authentication
      await deleteUserAccount(passwordForDeletion)

      // Show success toast with more details
      toast({
        title: "Account deleted",
        description:
          "Your account has been successfully deleted. Some data may be retained temporarily for backup purposes but will be permanently removed within 30 days.",
      })

      // Redirect to landing page
      router.push("/")
    } catch (err: any) {
      console.error("Account deletion error:", err)

      // Show a more helpful error message
      if (err.message?.includes("Missing or insufficient permissions")) {
        setError(
          "Unable to delete all account data due to permission restrictions. Please contact support for assistance.",
        )
      } else {
        setError(err.message || "Failed to delete account. Please try again later.")
      }

      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          {currentStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete your account? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Deleting your account will permanently remove all your data, including settings, transcripts,
                    recordings, and chat history.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => setCurrentStep("password")}>
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {currentStep === "password" && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Your Password</DialogTitle>
                <DialogDescription>Please enter your password to confirm your identity.</DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCurrentStep("confirm")} disabled={isLoading}>
                  Back
                </Button>
                <Button variant="destructive" onClick={handlePasswordSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {currentStep === "final-warning" && (
            <>
              <DialogHeader>
                <DialogTitle>Final Warning</DialogTitle>
                <DialogDescription>This is your last chance to reconsider.</DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Alert variant="destructive" className="border-2 border-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-lg font-bold">WARNING</AlertTitle>
                  <AlertDescription className="text-base font-semibold">
                    THIS ACTION WILL RESULT IN PERMANENT DATA LOSS
                  </AlertDescription>
                </Alert>

                <div className="mt-4 text-sm text-muted-foreground">
                  By clicking "Delete Account" below, you acknowledge that:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>All your data will be permanently deleted</li>
                    <li>This action cannot be undone</li>
                    <li>You will lose access to all services associated with this account</li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {show2FAModal && (
        <TwoFactorAuthModal
          userId={auth.currentUser?.uid || ""}
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          onSuccess={handle2FASuccess}
        />
      )}
    </>
  )
}

