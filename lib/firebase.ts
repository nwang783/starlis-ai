import { initializeApp } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth"
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore"
import { generateRandomString } from "@/lib/utils"
// Add these imports at the top
import {
  is2FAVerified,
  verifyTOTP,
  verifyRecoveryCode,
  save2FAVerificationStatus,
  clear2FAVerificationStatus,
} from "./2fa"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Authentication functions
export const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Generate a Starlis forwarding email
    const starlisEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.starlis.${generateRandomString(5)}@mail.starlis.com`

    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      firstName,
      lastName,
      email,
      starlisForwardingEmail: starlisEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Default SMTP settings (empty)
      smtpUsername: "",
      smtpPassword: "",
      smtpPort: "",
      smtpServer: "",
      smtpEncryption: "tls",
      // Default 2FA settings
      twoFactorEnabled: false,
      // Default integration settings
      integrations: {
        googleCalendar: false,
        outlookCalendar: false,
        appleCalendar: false,
        gmail: false,
        discord: false,
        twitter: false,
      },
      // Onboarding status
      onboarding: {
        emailSetupComplete: false,
        integrationsSetupComplete: false,
        voiceSetupComplete: false,
        onboardingComplete: false,
        integrations: {
          googleCalendar: false,
          outlookCalendar: false,
        },
        voice: {
          twilioSid: "",
          twilioApiKey: "",
          twilioPhoneNumber: "",
          elevenLabsApiKey: "",
          elevenLabsAgentId: "",
        },
      },
    })

    return user
  } catch (error) {
    throw error
  }
}

// Modify the signInWithEmail function to handle 2FA
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Get user data to check if 2FA is enabled
    const userDoc = await getDoc(doc(db, "users", user.uid))
    const userData = userDoc.data()

    if (userData?.twoFactorEnabled && !is2FAVerified(user.uid)) {
      // Return the user credential but include a 2FA flag
      return { ...userCredential, requiresTwoFactor: true }
    }

    return userCredential
  } catch (error) {
    throw error
  }
}

// Add a function to verify 2FA during login
export const verify2FALogin = async (userId: string, code: string, isRecoveryCode = false) => {
  try {
    // Get user data
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    const userData = userDoc.data()

    let verified = false

    if (isRecoveryCode) {
      verified = await verifyRecoveryCode(userId, code)
    } else {
      const secret = userData.twoFactor?.secret || ""
      verified = verifyTOTP(secret, code)
    }

    if (!verified) {
      throw new Error("Invalid verification code")
    }

    // Save verification status for this session
    await save2FAVerificationStatus(userId)

    return true
  } catch (error) {
    throw error
  }
}

// Update the signOutUser function to clear 2FA verification status
export const signOutUser = async () => {
  try {
    const user = auth.currentUser
    if (user) {
      clear2FAVerificationStatus(user.uid)
    }
    await signOut(auth)
  } catch (error) {
    throw error
  }
}

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  } catch (error) {
    throw error
  }
}

// Firestore functions
export const getUserData = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      console.log("No such document!")
      return null
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

export const updateUserData = async (userId: string, data: any) => {
  try {
    const docRef = doc(db, "users", userId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw error
  }
}

export const updateSmtpSettings = async (userId: string, smtpSettings: any) => {
  try {
    const docRef = doc(db, "users", userId)
    await updateDoc(docRef, {
      ...smtpSettings,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw error
  }
}

export const updateIntegrationSettings = async (userId: string, integrations: any) => {
  try {
    const docRef = doc(db, "users", userId)
    await updateDoc(docRef, {
      integrations: integrations,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw error
  }
}

export const regenerateStarlisEmail = async (userId: string, firstName: string, lastName: string) => {
  try {
    const newStarlisEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.starlis.${generateRandomString(5)}@mail.starlis.com`

    await updateDoc(doc(db, "users", userId), {
      starlisForwardingEmail: newStarlisEmail,
      updatedAt: serverTimestamp(),
    })

    return newStarlisEmail
  } catch (error) {
    throw error
  }
}

export const toggle2FA = async (userId: string, enabled: boolean) => {
  try {
    const docRef = doc(db, "users", userId)
    await updateDoc(docRef, {
      twoFactorEnabled: enabled,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw error
  }
}

export const saveChatMessage = async (userId: string, message: any) => {
  try {
    const chatRef = doc(collection(db, "users", userId, "chats"))
    await setDoc(chatRef, message)
  } catch (error) {
    throw error
  }
}

export const getChatMessages = async (userId: string, chatId: string) => {
  try {
    const chatRef = collection(db, "users", userId, "chats")
    const q = query(chatRef, orderBy("timestamp"))
    const querySnapshot = await getDocs(q)
    const messages: any[] = []
    querySnapshot.forEach((doc) => {
      messages.push(doc.data())
    })
    return messages
  } catch (error) {
    throw error
  }
}

export const createNewChat = async (userId: string) => {
  try {
    const chatRef = doc(collection(db, "users", userId, "chats"))
    const newChatId = chatRef.id
    await setDoc(doc(db, "users", userId, "chats", newChatId), {
      id: newChatId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      title: "New Chat",
      messageCount: 0,
    })
    return newChatId
  } catch (error) {
    throw error
  }
}

export const getChatHistory = async (userId: string) => {
  try {
    const chatRef = collection(db, "users", userId, "chats")
    const q = query(chatRef, orderBy("updatedAt", "desc"))
    const querySnapshot = await getDocs(q)
    const chats: any[] = []
    querySnapshot.forEach((doc) => {
      chats.push(doc.data())
    })
    return chats
  } catch (error) {
    throw error
  }
}

export { auth, db }

