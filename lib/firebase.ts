import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  writeBatch,
} from "firebase/firestore"
import { generateRandomString } from "./utils"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

// User authentication functions
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
    })

    return user
  } catch (error) {
    throw error
  }
}

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    throw error
  }
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid))

    if (!userDoc.exists()) {
      // Extract name from Google account
      const nameParts = user.displayName?.split(" ") || ["User", ""]
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

      // Generate a Starlis forwarding email
      const starlisEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.starlis.${generateRandomString(5)}@mail.starlis.com`

      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        firstName,
        lastName,
        email: user.email,
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
      })
    }

    return user
  } catch (error) {
    throw error
  }
}

export const signOutUser = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    throw error
  }
}

// User data functions
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return userDoc.data()
    }
    return null
  } catch (error) {
    throw error
  }
}

export const updateUserData = async (userId: string, data: any) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw error
  }
}

export const updateSmtpSettings = async (
  userId: string,
  smtpSettings: {
    smtpUsername: string
    smtpPassword: string
    smtpPort: string
    smtpServer: string
    smtpEncryption: string
  },
) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...smtpSettings,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw error
  }
}

export const updateIntegrationSettings = async (userId: string, integrations: any) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      integrations,
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
    await updateDoc(doc(db, "users", userId), {
      twoFactorEnabled: enabled,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw error
  }
}

// Chat history functions
export const saveChatMessage = async (
  userId: string,
  message: {
    role: string
    content: string
    timestamp: string
  },
) => {
  try {
    const chatRef = collection(db, "users", userId, "chats")
    const activeChatQuery = query(chatRef, where("active", "==", true), orderBy("createdAt", "desc"), limit(1))

    const activeChatSnapshot = await getDocs(activeChatQuery)

    let chatId

    if (activeChatSnapshot.empty) {
      // Create a new chat
      const newChatRef = await addDoc(chatRef, {
        title: message.content.substring(0, 50) + (message.content.length > 50 ? "..." : ""),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        active: true,
        messageCount: 1,
      })

      chatId = newChatRef.id
    } else {
      // Use existing active chat
      chatId = activeChatSnapshot.docs[0].id

      // Update the chat
      await updateDoc(doc(db, "users", userId, "chats", chatId), {
        updatedAt: serverTimestamp(),
        messageCount: activeChatSnapshot.docs[0].data().messageCount + 1,
      })
    }

    // Add message to the chat
    await addDoc(collection(db, "users", userId, "chats", chatId, "messages"), {
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      createdAt: serverTimestamp(),
    })

    return chatId
  } catch (error) {
    throw error
  }
}

export const getChatHistory = async (userId: string) => {
  try {
    const chatRef = collection(db, "users", userId, "chats")
    const chatQuery = query(chatRef, orderBy("updatedAt", "desc"), limit(10))

    const chatSnapshot = await getDocs(chatQuery)

    return chatSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    throw error
  }
}

export const getChatMessages = async (userId: string, chatId: string) => {
  try {
    const messagesRef = collection(db, "users", userId, "chats", chatId, "messages")
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"))

    const messagesSnapshot = await getDocs(messagesQuery)

    return messagesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    throw error
  }
}

export const createNewChat = async (userId: string) => {
  try {
    // Set all existing chats to inactive
    const chatRef = collection(db, "users", userId, "chats")
    const activeChatQuery = query(chatRef, where("active", "==", true))
    const activeChatSnapshot = await getDocs(activeChatQuery)

    const batch = writeBatch(db)
    activeChatSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { active: false })
    })

    await batch.commit()

    // Create a new active chat
    const newChatRef = await addDoc(chatRef, {
      title: "New Chat",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      active: true,
      messageCount: 0,
    })

    return newChatRef.id
  } catch (error) {
    throw error
  }
}

export { auth, db }

