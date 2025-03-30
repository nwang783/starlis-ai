"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Mail, Phone, RefreshCw, Edit2, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Import Firebase from the existing lib/firebase.ts
import { auth, db, updateUserData } from "@/lib/firebase"
import { RecaptchaVerifier as FirebaseRecaptchaVerifier } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"

interface VerificationStepProps {
  email: string
  phoneNumber: string
  onNext: () => void
  onBack?: () => void
  refreshUserData?: () => Promise<void>
}

export function VerificationStep({ email, phoneNumber, onNext, onBack, refreshUserData }: VerificationStepProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("email")
  const [emailCode, setEmailCode] = useState<string>("")
  const [phoneCode, setPhoneCode] = useState<string>("")
  const [emailVerified, setEmailVerified] = useState<boolean>(false)
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false)
  const [isResendingPhone, setIsResendingPhone] = useState<boolean>(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState<boolean>(false)
  const [isVerifyingPhone, setIsVerifyingPhone] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(0)

  // New state variables for editing
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false)
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false)
  const [newEmail, setNewEmail] = useState<string>(email)
  const [newPhoneNumber, setNewPhoneNumber] = useState<string>(phoneNumber)
  const [isSavingEmail, setIsSavingEmail] = useState<boolean>(false)
  const [isSavingPhone, setIsSavingPhone] = useState<boolean>(false)
  const [currentEmail, setCurrentEmail] = useState<string>(email)
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string>(phoneNumber)

  // Use a ref to store the RecaptchaVerifier instance
  const recaptchaVerifierRef = useRef<any>(null)
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)

  // For demo purposes, we'll use a fixed code
  // In production, you would use Firebase's actual verification
  const DEMO_CODE = "123456"

  // Initialize verification on component mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Send email verification code immediately
    sendEmailVerificationCode()

    // Initialize recaptcha after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      try {
        if (recaptchaContainerRef.current && !recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new FirebaseRecaptchaVerifier(auth, recaptchaContainerRef.current, {
            size: "invisible",
          })

          // After recaptcha is ready, send phone verification
          sendPhoneVerificationCode()
        }
      } catch (error) {
        console.error("Error initializing recaptcha:", error)
      }
    }, 1000)

    // Clean up
    return () => {
      clearTimeout(timeoutId)
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear()
        recaptchaVerifierRef.current = null
      }
    }
  }, [])

  // Countdown timer for resend buttons
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Auto-switch to phone tab when email is verified
  useEffect(() => {
    if (emailVerified && !phoneVerified) {
      setActiveTab("phone")
    }
  }, [emailVerified, phoneVerified])

  // Update current values when props change
  useEffect(() => {
    setCurrentEmail(email)
    setNewEmail(email)
    setCurrentPhoneNumber(phoneNumber)
    setNewPhoneNumber(phoneNumber)
  }, [email, phoneNumber])

  // Send email verification code
  const sendEmailVerificationCode = async () => {
    try {
      setIsResendingEmail(true)

      // In a real implementation, you would use Firebase's email verification
      // For demo purposes, we'll simulate sending a code

      toast({
        title: "Verification code sent",
        description: `A verification code has been sent to ${currentEmail}`,
      })

      setCountdown(60) // Set cooldown for resend button

      // For demo purposes, we'll use a fixed code
      console.log("Email verification code: 123456")
    } catch (error) {
      console.error("Error sending email verification:", error)
      toast({
        title: "Error",
        description: "Failed to send email verification code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResendingEmail(false)
    }
  }

  // Send phone verification code
  const sendPhoneVerificationCode = async () => {
    try {
      setIsResendingPhone(true)

      // In a real implementation, you would use Firebase's phone authentication
      // For demo purposes, we'll simulate sending a code

      toast({
        title: "Verification code sent",
        description: `A verification code has been sent to ${currentPhoneNumber}`,
      })

      setCountdown(60) // Set cooldown for resend button

      // For demo purposes, we'll use a fixed code
      console.log("Phone verification code: 123456")
    } catch (error) {
      console.error("Error sending phone verification:", error)
      toast({
        title: "Error",
        description: "Failed to send phone verification code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResendingPhone(false)
    }
  }

  // Verify email code
  const verifyEmailCode = async () => {
    try {
      setIsVerifyingEmail(true)
      setEmailError(null)

      // In a real implementation, you would verify the code with Firebase
      // For demo purposes, we'll accept a fixed code

      if (emailCode === DEMO_CODE) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setEmailVerified(true)
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified.",
        })

        // Update user document to mark email as verified
        if (auth.currentUser) {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            emailVerified: true,
          })
        }

        // Auto-switch to phone tab if phone is not verified yet
        if (!phoneVerified) {
          setActiveTab("phone")
        }
      } else {
        toast({
          title: "Invalid code",
          description: "The verification code you entered is incorrect.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying email:", error)
      toast({
        title: "Error",
        description: "Failed to verify email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  // Verify phone code
  const verifyPhoneCode = async () => {
    try {
      setIsVerifyingPhone(true)
      setPhoneError(null)

      // In a real implementation, you would verify the code with Firebase
      // For demo purposes, we'll accept a fixed code

      if (phoneCode === DEMO_CODE) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setPhoneVerified(true)
        toast({
          title: "Phone verified",
          description: "Your phone number has been successfully verified.",
        })

        // Update user document to mark phone as verified
        if (auth.currentUser) {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            phoneVerified: true,
          })
        }

        // Auto-switch to email tab if email is not verified yet
        if (!emailVerified) {
          setActiveTab("email")
        }
      } else {
        toast({
          title: "Invalid code",
          description: "The verification code you entered is incorrect.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying phone:", error)
      toast({
        title: "Error",
        description: "Failed to verify phone number. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingPhone(false)
    }
  }

  // Function to save updated email
  const saveEmail = async () => {
    if (!auth.currentUser) return

    try {
      setIsSavingEmail(true)

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newEmail)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        })
        return
      }

      // Update email in Firebase
      await updateUserData(auth.currentUser.uid, {
        email: newEmail,
        emailVerified: false, // Reset verification status
      })

      // Update local state
      setCurrentEmail(newEmail)
      setEmailVerified(false)

      // Exit edit mode
      setIsEditingEmail(false)

      // Reset verification code
      setEmailCode("")

      toast({
        title: "Email updated",
        description: "Your email has been updated. Please verify your new email.",
      })

      // Refresh user data
      if (refreshUserData) {
        await refreshUserData()
      }

      // Send verification code to new email
      sendEmailVerificationCode()
    } catch (error) {
      console.error("Error updating email:", error)
      toast({
        title: "Error",
        description: "Failed to update email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingEmail(false)
    }
  }

  // Function to save updated phone number
  const savePhoneNumber = async () => {
    if (!auth.currentUser) return

    try {
      setIsSavingPhone(true)

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+\d{1,3}\d{9,10}$/
      if (!phoneRegex.test(newPhoneNumber)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid phone number with country code (e.g., +12345678901).",
          variant: "destructive",
        })
        return
      }

      // Update phone number in Firebase
      await updateUserData(auth.currentUser.uid, {
        phoneNumber: newPhoneNumber,
        phoneVerified: false, // Reset verification status
      })

      // Update local state
      setCurrentPhoneNumber(newPhoneNumber)
      setPhoneVerified(false)

      // Exit edit mode
      setIsEditingPhone(false)

      // Reset verification code
      setPhoneCode("")

      toast({
        title: "Phone number updated",
        description: "Your phone number has been updated. Please verify your new phone number.",
      })

      // Refresh user data
      if (refreshUserData) {
        await refreshUserData()
      }

      // Send verification code to new phone number
      sendPhoneVerificationCode()
    } catch (error) {
      console.error("Error updating phone number:", error)
      toast({
        title: "Error",
        description: "Failed to update phone number. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPhone(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Step 1: Verify Your Account</CardTitle>
        <CardDescription>Please verify your email and phone number to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {isEditingEmail ? (
              <div className="flex-1 flex items-center space-x-2">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" onClick={() => saveEmail()} disabled={isSavingEmail}>
                    {isSavingEmail ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingEmail(false)
                      setNewEmail(currentEmail)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-primary" />
                <span className="font-medium">Email: {currentEmail}</span>
                {!emailVerified && (
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingEmail(true)} className="ml-2 h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            {emailVerified && (
              <div className="flex items-center text-green-500">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {isEditingPhone ? (
              <div className="flex-1 flex items-center space-x-2">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number (e.g., +12345678901)"
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" onClick={() => savePhoneNumber()} disabled={isSavingPhone}>
                    {isSavingPhone ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingPhone(false)
                      setNewPhoneNumber(currentPhoneNumber)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-primary" />
                <span className="font-medium">Phone: {currentPhoneNumber}</span>
                {!phoneVerified && (
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingPhone(true)} className="ml-2 h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            {phoneVerified && (
              <div className="flex items-center text-green-500">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" disabled={emailVerified}>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Email</span>
                  {emailVerified && <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />}
                </div>
              </TabsTrigger>
              <TabsTrigger value="phone" disabled={phoneVerified}>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  <span>Phone</span>
                  {phoneVerified && <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />}
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-4">
              {emailVerified ? (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Email verified successfully!
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      We've sent a verification code to <strong>{currentEmail}</strong>. Please enter the code below.
                    </p>

                    {emailError && (
                      <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-700 dark:text-red-300">{emailError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email-code">Verification Code</Label>
                      <Input
                        id="email-code"
                        placeholder="Enter 6-digit code"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        maxLength={6}
                        className="font-mono text-center text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={sendEmailVerificationCode}
                      disabled={isResendingEmail || countdown > 0}
                    >
                      {countdown > 0 ? (
                        `Resend in ${countdown}s`
                      ) : (
                        <span className="flex items-center">
                          <RefreshCw className="mr-1 h-4 w-4" />
                          Resend Code
                        </span>
                      )}
                    </Button>
                    <Button onClick={verifyEmailCode} disabled={emailCode.length !== 6 || isVerifyingEmail}>
                      {isVerifyingEmail ? "Verifying..." : "Verify Email"}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="phone" className="mt-4">
              {phoneVerified ? (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Phone number verified successfully!
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      We've sent a verification code to <strong>{currentPhoneNumber}</strong>. Please enter the code
                      below.
                    </p>

                    {phoneError && (
                      <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-700 dark:text-red-300">{phoneError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="phone-code">Verification Code</Label>
                      <Input
                        id="phone-code"
                        placeholder="Enter 6-digit code"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        maxLength={6}
                        className="font-mono text-center text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={sendPhoneVerificationCode}
                      disabled={isResendingPhone || countdown > 0}
                    >
                      {countdown > 0 ? (
                        `Resend in ${countdown}s`
                      ) : (
                        <span className="flex items-center">
                          <RefreshCw className="mr-1 h-4 w-4" />
                          Resend Code
                        </span>
                      )}
                    </Button>
                    <Button onClick={verifyPhoneCode} disabled={phoneCode.length !== 6 || isVerifyingPhone}>
                      {isVerifyingPhone ? "Verifying..." : "Verify Phone"}
                    </Button>
                  </div>

                  {/* Use a ref for the recaptcha container */}
                  <div ref={recaptchaContainerRef} id="recaptcha-container" className="mt-4"></div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {emailVerified && phoneVerified
            ? "All verification steps completed!"
            : `${emailVerified ? "1" : "0"}/2 steps completed`}
        </div>
        {emailVerified && phoneVerified && <Button onClick={onNext}>Continue</Button>}
      </CardFooter>
    </Card>
  )
}

