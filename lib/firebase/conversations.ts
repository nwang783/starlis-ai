import { db } from '../firebase'
import { collection, doc, getDoc, getDocs, query, orderBy, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { Conversation, Message } from '../types'
import { v4 as uuidv4 } from 'uuid'

// Create a new conversation
export async function createConversation(userId: string, name: string): Promise<string> {
  const conversationRef = doc(collection(db, 'users', userId, 'conversations'))
  const conversationId = conversationRef.id

  const conversation: Conversation = {
    id: conversationId,
    name,
    timeCreated: serverTimestamp(),
    timeLastModified: serverTimestamp()
  }

  await setDoc(conversationRef, conversation)
  return conversationId
}

// Get a conversation by ID
export async function getConversation(userId: string, conversationId: string): Promise<Conversation | null> {
  const docRef = doc(db, 'users', userId, 'conversations', conversationId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() as Conversation : null
}

// Get all conversations for a user
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const conversationsRef = collection(db, 'users', userId, 'conversations')
  const q = query(
    conversationsRef,
    orderBy('timeLastModified', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => doc.data() as Conversation)
}

// Add a message to a conversation
export async function addMessage(userId: string, conversationId: string, message: Message): Promise<void> {
  const messageRef = doc(collection(db, 'users', userId, 'conversations', conversationId, 'messages'))
  const messageId = messageRef.id

  // Update the message with the generated ID
  message.id = messageId

  // Add the message to the messages subcollection
  await setDoc(messageRef, {
    ...message,
    timestamp: serverTimestamp()
  })

  // Update the conversation's last modified time
  const conversationRef = doc(db, 'users', userId, 'conversations', conversationId)
  await updateDoc(conversationRef, {
    timeLastModified: serverTimestamp()
  })
}

// Get all messages for a conversation
export async function getConversationMessages(userId: string, conversationId: string): Promise<Message[]> {
  const messagesRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages')
  const q = query(messagesRef, orderBy('timestamp', 'asc'))
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => doc.data() as Message)
}

// Update a message in a conversation
export async function updateMessage(
  userId: string,
  conversationId: string,
  messageId: string,
  updatedMessage: Message
): Promise<void> {
  const messageRef = doc(db, 'users', userId, 'conversations', conversationId, 'messages', messageId)
  
  await updateDoc(messageRef, {
    ...updatedMessage,
    timestamp: serverTimestamp()
  })

  // Update the conversation's last modified time
  const conversationRef = doc(db, 'users', userId, 'conversations', conversationId)
  await updateDoc(conversationRef, {
    timeLastModified: serverTimestamp()
  })
}

// Delete a message from a conversation
export async function deleteMessage(
  userId: string,
  conversationId: string,
  messageId: string
): Promise<void> {
  const messageRef = doc(db, 'users', userId, 'conversations', conversationId, 'messages', messageId)
  
  await deleteDoc(messageRef)

  // Update the conversation's last modified time
  const conversationRef = doc(db, 'users', userId, 'conversations', conversationId)
  await updateDoc(conversationRef, {
    timeLastModified: serverTimestamp()
  })
}

// Delete a conversation and all its messages
export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const conversationRef = doc(db, 'users', userId, 'conversations', conversationId)
  
  // Delete all messages in the conversation
  const messagesRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages')
  const messagesSnapshot = await getDocs(messagesRef)
  const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref))
  await Promise.all(deletePromises)
  
  // Delete the conversation document
  await deleteDoc(conversationRef)
}

// Update conversation name
export async function updateConversationName(
  userId: string,
  conversationId: string,
  newName: string
): Promise<void> {
  const conversationRef = doc(db, 'users', userId, 'conversations', conversationId)
  await updateDoc(conversationRef, {
    name: newName,
    timeLastModified: serverTimestamp()
  })
} 