import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import md5 from "md5"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a phone number from a string
 * @param text The text to extract a phone number from
 * @returns The extracted phone number or null if none found
 */
export function extractPhoneNumber(text: string): string | null {
  if (!text) return null

  try {
    // Very simple approach to avoid regex issues
    // Look for sequences of digits that could be phone numbers
    const digits = text.match(/\d+/g)

    if (!digits || digits.length === 0) {
      return null
    }

    // Look for sequences that could be phone numbers (7+ digits)
    for (const digitSeq of digits) {
      if (digitSeq.length >= 7) {
        return digitSeq
      }
    }

    // If we can't find a good candidate, join the first 10 digits we find
    const allDigits = digits.join("")
    if (allDigits.length >= 7) {
      return allDigits.substring(0, Math.min(10, allDigits.length))
    }

    return null
  } catch (error) {
    console.error("Error extracting phone number:", error)
    return null
  }
}

/**
 * Generates a Gravatar URL for an email address
 * @param email The email address to generate a Gravatar URL for
 * @returns The Gravatar URL
 */
export function getGravatarUrl(email: string): string {
  if (!email) return "https://www.gravatar.com/avatar/?d=mp"

  // Use the md5 library instead of crypto
  const hash = md5(email.toLowerCase().trim())

  return `https://www.gravatar.com/avatar/${hash}?d=mp`
}

/**
 * Generates a random string of a specified length
 * @param length The length of the random string to generate
 * @returns A random string
 */
export function generateRandomString(length = 10): string {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""

  // Use Math.random instead of crypto for simplicity
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

// Format phone number to (XXX) XXX-XXXX
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "")

  // Check if it's a valid US phone number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11 && cleaned[0] === "1") {
    // Handle numbers with country code
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // If not a standard format, return the original
  return phoneNumber
}

// Format duration in seconds to MM:SS
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

