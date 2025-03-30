"use client"

import { useState, useEffect } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { initializeApp } from "firebase/app"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
let app
try {
  app = initializeApp(firebaseConfig)
} catch (error) {
  console.error("Firebase initialization error", error)
}

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!app) return

    const auth = getAuth(app)

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setUser({
          id: user.uid,
          email: user.email,
          phoneNumber: user.phoneNumber || "+1234567890", // Fallback for demo
          displayName: user.displayName,
          photoURL: user.photoURL,
        })
      } else {
        // User is signed out
        setUser(null)
      }
      setIsLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  return { user, isLoading }
}

