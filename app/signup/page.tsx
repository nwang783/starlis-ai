"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, InfoIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleLoginButton } from "@/components/google-login-button"
import { signUpWithEmail } from "@/lib/firebase"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    countryCode: "+1",
  })
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  })
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

  const validateForm = () => {
    let isValid = true
    const errors = {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
    }

    // Validate email
    if (!formData.email) {
      errors.email = "Email is required"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid"
      isValid = false
    }

    // Validate password
    if (!formData.password) {
      errors.password = "Password is required"
      isValid = false
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters"
      isValid = false
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
      isValid = false
    }

    // Validate first name
    if (!formData.firstName) {
      errors.firstName = "First name is required"
      isValid = false
    }

    // Validate last name
    if (!formData.lastName) {
      errors.lastName = "Last name is required"
      isValid = false
    }

    // Validate phone number
    if (!formData.phoneNumber) {
      errors.phoneNumber = "Phone number is required"
      isValid = false
    } else if (formData.phoneNumber.replace(/\D/g, "").length !== 10) {
      errors.phoneNumber = "Phone number must be 10 digits"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleCountryCodeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      countryCode: value,
    }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get only the digits from the input
    const digits = e.target.value.replace(/\D/g, "")

    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10)

    // Format the phone number
    let formattedPhone = ""
    if (limitedDigits.length > 0) {
      formattedPhone = "(" + limitedDigits.slice(0, 3)
      if (limitedDigits.length > 3) {
        formattedPhone += ") " + limitedDigits.slice(3, 6)
        if (limitedDigits.length > 6) {
          formattedPhone += "-" + limitedDigits.slice(6, 10)
        }
      }
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      phoneNumber: formattedPhone,
    }))

    // Clear error when user types
    if (formErrors.phoneNumber) {
      setFormErrors((prev) => ({
        ...prev,
        phoneNumber: "",
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Format the phone number for storage: combine country code with digits only
      const phoneDigits = formData.phoneNumber.replace(/\D/g, "")
      const fullPhoneNumber = formData.countryCode + phoneDigits

      await signUpWithEmail(formData.email, formData.password, formData.firstName, formData.lastName, fullPhoneNumber)

      // Redirect to onboarding instead of dashboard
      router.push("/onboarding")
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

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px] z-10">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex items-center justify-center mb-4 gap-2">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/circle-with-irregular-shape-inside-svgrepo-com-krMECzHbCO4kkkJCa2jNlslczUaIzc.svg"
              alt="Starlis Logo"
              className="h-10 dark:brightness-0 dark:invert"
            />
            <span className="text-xl font-bold">starlis.ai</span>
          </div>
        </div>
        <Card className="rounded-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>Choose your preferred sign up method</CardDescription>
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
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                    />
                    {formErrors.firstName && <p className="text-xs text-destructive">{formErrors.firstName}</p>}
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                    />
                    {formErrors.lastName && <p className="text-xs text-destructive">{formErrors.lastName}</p>}
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                </div>
                <div className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={5}>
                          <p>Only +1 (US/Canada) is supported for now</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-[90px]">
                      <Select value={formData.countryCode} onValueChange={handleCountryCodeChange} disabled={isLoading}>
                        <SelectTrigger className="px-2 truncate">
                          <span className="w-full text-left">{formData.countryCode}</span>
                        </SelectTrigger>
                        <SelectContent className="min-w-[180px]">
                          <SelectItem value="+1">+1 (US/Canada)</SelectItem>
                          <SelectItem value="+44" disabled>
                            +44 (UK)
                          </SelectItem>
                          <SelectItem value="+61" disabled>
                            +61 (Australia)
                          </SelectItem>
                          <SelectItem value="+33" disabled>
                            +33 (France)
                          </SelectItem>
                          <SelectItem value="+49" disabled>
                            +49 (Germany)
                          </SelectItem>
                          <SelectItem value="+91" disabled>
                            +91 (India)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="(555) 555-5555"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      disabled={isLoading}
                      required
                      className="flex-1"
                      inputMode="numeric"
                      maxLength={14} // (XXX) XXX-XXXX = 14 characters
                    />
                  </div>
                  {formErrors.phoneNumber && <p className="text-xs text-destructive">{formErrors.phoneNumber}</p>}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    autoCorrect="off"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    autoCorrect="off"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>
                  )}
                </div>
                <Button disabled={isLoading}>{isLoading ? "Creating account..." : "Create account"}</Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

