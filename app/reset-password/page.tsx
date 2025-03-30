"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { confirmPasswordReset, verifyPasswordResetCode } from "@/lib/firebase"

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState<string | null>(null)
  const [actionCode, setActionCode] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get the action code from the URL
    const oobCode = searchParams.get("oobCode")

    if (!oobCode) {
      setError("Invalid password reset link. Please try again.")
      setIsVerifying(false)
      return
    }

    setActionCode(oobCode)

    // Verify the action code
    const verifyCode = async () => {
      try {
        // Verify the password reset code
        const email = await verifyPasswordResetCode(oobCode)
        setEmail(email)
        setIsVerifying(false)
      } catch (err) {
        console.error("Error verifying reset code:", err)
        setError("This password reset link is invalid or has expired. Please request a new one.")
        setIsVerifying(false)
      }
    }

    verifyCode()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!actionCode) {
      setError("Invalid password reset link. Please try again.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Confirm the password reset
      await confirmPasswordReset(actionCode, password)
      setSuccess(true)
    } catch (err: any) {
      console.error("Error resetting password:", err)

      if (err.code === "auth/expired-action-code") {
        setError("This password reset link has expired. Please request a new one.")
      } else if (err.code === "auth/invalid-action-code") {
        setError("This password reset link is invalid. Please request a new one.")
      } else if (err.code === "auth/weak-password") {
        setError("Please choose a stronger password.")
      } else {
        setError("An error occurred while resetting your password. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="rounded-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Verifying Link</CardTitle>
              <CardDescription>Please wait while we verify your reset link</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="rounded-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Password Reset Successful</CardTitle>
              <CardDescription>Your password has been reset successfully</CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <Alert className="bg-primary/10 border-primary/20">
                <Check className="h-4 w-4 text-primary" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your password has been reset successfully. You can now sign in with your new password.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">STARLIS</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Reset Your Password</h1>
          {email && (
            <p className="text-sm text-muted-foreground">
              Create a new password for <span className="font-medium">{email}</span>
            </p>
          )}
        </div>
        <Card className="rounded-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Create New Password</CardTitle>
            <CardDescription>Enter and confirm your new password</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

