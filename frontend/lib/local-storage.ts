// Local storage fallback for when Firestore is unavailable

// Save chat message to local storage
export function saveMessageToLocalStorage(userId: string, chatId: string, message: any) {
  try {
    // Get existing messages for this chat
    const storageKey = `chat_${userId}_${chatId}`
    const existingMessagesJson = localStorage.getItem(storageKey)
    const existingMessages = existingMessagesJson ? JSON.parse(existingMessagesJson) : []

    // Add new message
    existingMessages.push(message)

    // Save back to local storage
    localStorage.setItem(storageKey, JSON.stringify(existingMessages))

    return true
  } catch (error) {
    console.error("Error saving message to local storage:", error)
    return false
  }
}

// Get chat messages from local storage
export function getMessagesFromLocalStorage(userId: string, chatId: string) {
  try {
    const storageKey = `chat_${userId}_${chatId}`
    const messagesJson = localStorage.getItem(storageKey)
    return messagesJson ? JSON.parse(messagesJson) : []
  } catch (error) {
    console.error("Error getting messages from local storage:", error)
    return []
  }
}

// Create a new chat in local storage
export function createLocalChat(userId: string, title: string) {
  try {
    // Generate a random chat ID
    const chatId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Get existing chats
    const chatsKey = `chats_${userId}`
    const existingChatsJson = localStorage.getItem(chatsKey)
    const existingChats = existingChatsJson ? JSON.parse(existingChatsJson) : []

    // Add new chat
    const newChat = {
      id: chatId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    existingChats.push(newChat)

    // Save back to local storage
    localStorage.setItem(chatsKey, JSON.stringify(existingChats))

    return chatId
  } catch (error) {
    console.error("Error creating local chat:", error)
    return `local_${Date.now()}`
  }
}

// Get recent chats from local storage
export function getRecentChatsFromLocalStorage(userId: string) {
  try {
    const chatsKey = `chats_${userId}`
    const chatsJson = localStorage.getItem(chatsKey)
    return chatsJson ? JSON.parse(chatsJson) : []
  } catch (error) {
    console.error("Error getting recent chats from local storage:", error)
    return []
  }
}

