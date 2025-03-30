import * as OTPAuth from "otpauth"
import QRCode from "qrcode"
import { db } from "./firebase"
import { doc, updateDoc, getDoc } from "firebase/firestore"

// Generate a new OTP secret for the user
export const generateOTPSecret = async (userId: string, email: string): Promise<string> => {
  try {
    // Generate a new TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: "Starlis",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    })

    const secret = totp.secret.base32

    // Save the secret to Firestore
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      "twoFactor.secret": secret,
      "twoFactor.enabled": false,
      "twoFactor.verified": false,
    })

    return secret
  } catch (error) {
    console.error("Error generating OTP secret:", error)
    throw error
  }
}

// Generate recovery codes for the user
export const generateRecoveryCodes = async (userId: string): Promise<string[]> => {
  try {
    // Generate 10 random recovery codes
    const codes = Array.from({ length: 10 }, () => [...Array(10)].map(() => Math.floor(Math.random() * 10)).join(""))

    // Save the recovery codes to Firestore
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      "twoFactor.recoveryCodes": codes,
      "twoFactor.recoveryCodesRemaining": codes.length,
    })

    return codes
  } catch (error) {
    console.error("Error generating recovery codes:", error)
    throw error
  }
}

// Generate QR code for 2FA setup
export const generateQRCode = async (secret: string, email: string): Promise<string> => {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: "Starlis",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    })

    const url = totp.toString()
    return await QRCode.toDataURL(url)
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw error
  }
}

// Verify a TOTP code
export const verifyTOTP = (secret: string, code: string): boolean => {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: "Starlis",
      label: "User",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    })

    const delta = totp.validate({ token: code, window: 1 })
    return delta !== null
  } catch (error) {
    console.error("Error verifying TOTP:", error)
    return false
  }
}

// Enable 2FA for a user
export const enable2FA = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      "twoFactor.enabled": true,
      "twoFactor.verified": true,
      twoFactorEnabled: true, // For backward compatibility with existing code
    })
  } catch (error) {
    console.error("Error enabling 2FA:", error)
    throw error
  }
}

// Disable 2FA for a user
export const disable2FA = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      "twoFactor.enabled": false,
      "twoFactor.verified": false,
      "twoFactor.secret": "",
      "twoFactor.recoveryCodes": [],
      "twoFactor.recoveryCodesRemaining": 0,
      twoFactorEnabled: false, // For backward compatibility with existing code
    })
  } catch (error) {
    console.error("Error disabling 2FA:", error)
    throw error
  }
}

// Verify a recovery code
export const verifyRecoveryCode = async (userId: string, code: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return false
    }

    const userData = userDoc.data()
    const recoveryCodes = userData.twoFactor?.recoveryCodes || []

    const codeIndex = recoveryCodes.indexOf(code)
    if (codeIndex === -1) {
      return false
    }

    // Remove the used recovery code
    const updatedCodes = [...recoveryCodes]
    updatedCodes.splice(codeIndex, 1)

    await updateDoc(userRef, {
      "twoFactor.recoveryCodes": updatedCodes,
      "twoFactor.recoveryCodesRemaining": updatedCodes.length,
    })

    return true
  } catch (error) {
    console.error("Error verifying recovery code:", error)
    return false
  }
}

// Save 2FA verification status for session
export const save2FAVerificationStatus = async (userId: string): Promise<void> => {
  try {
    // In a real implementation, this would set a server-side session flag
    // For this demo, we'll use localStorage
    localStorage.setItem(`2fa_verified_${userId}`, "true")
  } catch (error) {
    console.error("Error saving 2FA verification status:", error)
    throw error
  }
}

// Check if 2FA is verified for the current session
export const is2FAVerified = (userId: string): boolean => {
  try {
    return localStorage.getItem(`2fa_verified_${userId}`) === "true"
  } catch (error) {
    console.error("Error checking 2FA verification status:", error)
    return false
  }
}

// Clear 2FA verification status on logout
export const clear2FAVerificationStatus = (userId: string): void => {
  try {
    localStorage.removeItem(`2fa_verified_${userId}`)
  } catch (error) {
    console.error("Error clearing 2FA verification status:", error)
  }
}

// Get 2FA status for a user
export const get2FAStatus = async (
  userId: string,
): Promise<{
  enabled: boolean
  secret: string
  verified: boolean
  recoveryCodes: string[]
  recoveryCodesRemaining: number
}> => {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    const userData = userDoc.data()

    return {
      enabled: userData.twoFactor?.enabled || false,
      secret: userData.twoFactor?.secret || "",
      verified: userData.twoFactor?.verified || false,
      recoveryCodes: userData.twoFactor?.recoveryCodes || [],
      recoveryCodesRemaining: userData.twoFactor?.recoveryCodesRemaining || 0,
    }
  } catch (error) {
    console.error("Error getting 2FA status:", error)
    throw error
  }
}

