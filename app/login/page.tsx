"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleLoginButton } from "@/components/google-login-button"
import { signInWithEmail, getUserData } from "@/lib/firebase"
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
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">STAR</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Starlis</h1>
          <p className="text-sm text-muted-foreground">Enter your email to sign in to your account</p>
        </div>
        <Card className="rounded-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Choose your preferred sign in method</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <GoogleLoginButton />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="current-password"
                    autoCorrect="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button disabled={isLoading}>{isLoading ? "Signing in..." : "Sign In"}</Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="mt-2 text-center text-sm text-muted-foreground">
              <Link href="/forgot-password" className="underline underline-offset-4 hover:text-primary">
                Forgot password?
              </Link>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
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

