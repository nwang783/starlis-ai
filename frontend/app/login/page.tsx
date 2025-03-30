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
import { ForgotPasswordModal } from "@/components/forgot-password-modal"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showTwoFactorAuth, setShowTwoFactorAuth] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [currentUserId, setCurrentUserId] = useState("")
  const router = useRouter()

  // Add animation styles for the blob
  const animationStyles = `
    @keyframes blob {
      0% {
        transform: translate(0px, 0px) scale(1);
      }
      33% {
        transform: translate(30px, -50px) scale(1.1);
      }
      66% {
        transform: translate(-20px, 20px) scale(0.9);
      }
      100% {
        transform: translate(0px, 0px) scale(1);
      }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animation-delay-4000 {
      animation-delay: 4s;
    }
  `

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
    <div className="flex h-screen w-full flex-col items-center justify-center relative overflow-hidden">
      <style jsx global>
        {animationStyles}
      </style>

      {/* Gradient Background */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-500/20 via-red-500/10 to-purple-600/20 opacity-50 -z-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-600 to-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] z-10">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex items-center justify-center mb-4 gap-2">
            <img
              src="/starlis_cutout.svg"
              alt="Starlis Logo"
              className="h-10 dark:brightness-0 dark:invert"
            />
            <span className="text-xl font-bold">starlis.ai</span>
          </div>
        </div>
        <Card className="rounded-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign In</CardTitle>
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
              <button onClick={() => setShowForgotPassword(true)} className="text-primary">
                Forgot Password?
              </button>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="no-underline hover:text-primary">
                Sign Up
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
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </div>
  )
}

