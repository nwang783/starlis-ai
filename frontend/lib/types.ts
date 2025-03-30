export type MessageType = 'text' | 'phone' | 'email' | 'codebox'

export interface BaseMessage {
  id: string
  type: MessageType
  role: 'user' | 'assistant'
  timestamp: string
}

export interface TextMessage extends BaseMessage {
  type: 'text'
  content: string
}

export interface PhoneMessage extends BaseMessage {
  type: 'phone'
  phoneNumber: string
  contactName?: string
  callStatus: 'connecting' | 'in-progress' | 'completed' | 'failed'
  duration: number
  notes?: string
}

export interface EmailMessage extends BaseMessage {
  type: 'email'
  subject: string
  recipient: string
  body: string
  status: 'draft' | 'sent' | 'failed'
}

export interface CodeboxMessage extends BaseMessage {
  type: 'codebox'
  content: string
  language?: string
}

export type Message = TextMessage | PhoneMessage | EmailMessage | CodeboxMessage

export interface Conversation {
  id: string
  name: string
  context?: string
  language?: string
  ownerId: string
  timeCreated: string
  timeLastModified: string
  messages: Message[]
} 