"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleLoginButton } from "@/components/google-login-button"
import { signInWithEmail, getUserData } from "@/lib/firebase"
import { Loader2 } from "lucide-react"
import { TwoFactorAuthModal } from "@/components/two-factor-auth-modal"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showTwoFactorAuth, setShowTwoFactorAuth] = useState(false)
  const [currentUserId, setCurrentUserId] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const userCredential = await signInWithEmail(email, password)

      // Check if 2FA is required
      if (userCredential.requiresTwoFactor) {
        setCurrentUserId(userCredential.user.uid)
        setShowTwoFactorAuth(true)
        setIsLoading(false)
        return
      }

      // Check if user has completed onboarding
      const userData = await getUserData(userCredential.user.uid)

      if (userData && userData.onboarding && userData.onboarding.onboardingComplete) {
        router.push("/dashboard")
      } else {
        router.push("/onboarding")
      }
    } catch (err: any) {
      console.error("Login error:", err)

      // Handle Firebase auth errors
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password")
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.")
      } else {
        setError("An error occurred during sign in. Please try again.")
      }
      setIsLoading(false)
    }
  }

  const handleTwoFactorSuccess = async () => {
    setShowTwoFactorAuth(false)

    try {
      // Get user data to check onboarding status
      const userData = await getUserData(currentUserId)

      if (userData && userData.onboarding && userData.onboarding.onboardingComplete) {
        router.push("/dashboard")
      } else {
        router.push("/onboarding")
      }
    } catch (error) {
      console.error("Error after 2FA:", error)
      setError("An error occurred after verification. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">STARLIS</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sign in to your account</CardTitle>
          <CardDescription>Enter your email and password to sign in to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <GoogleLoginButton />
          </CardContent>
        </form>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
      {showTwoFactorAuth && (
        <TwoFactorAuthModal
          userId={currentUserId}
          isOpen={showTwoFactorAuth}
          onClose={() => setShowTwoFactorAuth(false)}
          onSuccess={handleTwoFactorSuccess}
        />
      )}
    </div>
  )
}

