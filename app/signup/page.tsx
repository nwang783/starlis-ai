"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, EyeIcon, EyeOffIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { signUpWithEmail } from "@/lib/firebase"

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    setFormErrors((prev) => ({ ...prev, [name]: "" }))

    // Password strength check
    if (name === "password") {
      checkPasswordStrength(value)
    }

    // Password match check
    if (name === "confirmPassword" || (name === "password" && formData.confirmPassword)) {
      if (name === "confirmPassword" && value !== formData.password) {
        setFormErrors((prev) => ({ ...prev, confirmPassword: "Passwords don't match" }))
      } else if (name === "password" && value !== formData.confirmPassword && formData.confirmPassword) {
        setFormErrors((prev) => ({ ...prev, confirmPassword: "Passwords don't match" }))
      } else {
        setFormErrors((prev) => ({ ...prev, confirmPassword: "" }))
      }
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeToTerms: checked }))
    setFormErrors((prev) => ({ ...prev, agreeToTerms: "" }))
  }

  const checkPasswordStrength = (password: string) => {
    // Simple password strength algorithm
    let strength = 0
    let feedback = ""

    if (password.length >= 8) {
      strength += 25
    }

    if (password.match(/[A-Z]/)) {
      strength += 25
    }

    if (password.match(/[0-9]/)) {
      strength += 25
    }

    if (password.match(/[^A-Za-z0-9]/)) {
      strength += 25
    }

    if (strength <= 25) {
      feedback = "Weak password"
    } else if (strength <= 50) {
      feedback = "Moderate password"
    } else if (strength <= 75) {
      feedback = "Good password"
    } else {
      feedback = "Strong password"
    }

    setPasswordStrength(strength)
    setPasswordFeedback(feedback)
  }

  const validateForm = () => {
    let isValid = true
    const errors = { ...formErrors }

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required"
      isValid = false
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required"
      isValid = false
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid"
      isValid = false
    }

    if (!formData.password) {
      errors.password = "Password is required"
      isValid = false
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters"
      isValid = false
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
      isValid = false
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords don't match"
      isValid = false
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the terms"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await signUpWithEmail(formData.email, formData.password, formData.firstName, formData.lastName)

      // Redirect to dashboard on success
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Signup error:", err)

      // Handle Firebase auth errors
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use. Please try another email or sign in.")
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.")
      } else {
        setError("An error occurred during sign up. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to home</span>
            </Link>
          </Button>
          <div className="flex items-center space-x-2">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">STARLIS</span>
            </div>
            <span className="font-bold text-xl">Starlis AI</span>
          </div>
        </div>

        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Enter your information to get started with Starlis AI</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={cn(formErrors.firstName && "border-destructive")}
                  />
                  {formErrors.firstName && <p className="text-xs text-destructive">{formErrors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={cn(formErrors.lastName && "border-destructive")}
                  />
                  {formErrors.lastName && <p className="text-xs text-destructive">{formErrors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={cn(formErrors.email && "border-destructive")}
                />
                {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={cn(formErrors.password && "border-destructive")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
                {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}

                {formData.password && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength</span>
                      <span
                        className={cn(
                          "font-medium",
                          passwordStrength <= 25 && "text-destructive",
                          passwordStrength > 25 && passwordStrength <= 50 && "text-amber-500",
                          passwordStrength > 50 && passwordStrength <= 75 && "text-amber-600",
                          passwordStrength > 75 && "text-emerald-500",
                        )}
                      >
                        {passwordFeedback}
                      </span>
                    </div>
                    <Progress value={passwordStrength} className="h-1" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={cn(formErrors.confirmPassword && "border-destructive")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
                {formErrors.confirmPassword && <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={handleCheckboxChange}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary underline hover:text-primary/90">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary underline hover:text-primary/90">
                        Privacy Policy
                      </Link>
                    </label>
                    {formErrors.agreeToTerms && <p className="text-xs text-destructive">{formErrors.agreeToTerms}</p>}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline hover:text-primary/90">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            By signing up, you acknowledge that you have read and understood our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

