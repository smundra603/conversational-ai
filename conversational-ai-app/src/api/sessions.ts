const BASE_URL = 'http://localhost:3000'
import { fetchWithRetry } from './http'

export type Session = {
  _id: string
  userId: string
  agentId: string
  createdAt?: string
  updatedAt?: string
}

export type Message = {
  _id: string
  content: string
  senderId: string
  senderType: 'user' | 'agent'
  sessionId: string
  isGenerating: boolean
  replyToMessageId?: string
  createdAt?: string
  updatedAt?: string
  metadata?: MessageMetadata
}

export type MessageMetadata = {
  _id: string
  createdById: string
  updatedById: string
  agentId: string
  provider: string
  sessionId: string
  generativeResponseId: string
  tokensIn: number
  tokensOut: number
  totalTokens: number
  cost: number
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export async function listSessions(): Promise<Session[]> {
  const res = await fetchWithRetry(`${BASE_URL}/session/list`, {
    method: 'GET',
    credentials: 'include'
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Sessions fetch failed: ${res.status}`)
  }
  const json = await res.json()
  // Support both array and object-wrapped responses
  const data: Session[] = Array.isArray(json)
    ? (json as Session[])
    : (json?.sessions as Session[]) ?? []
  return data
}

export async function createSession(agentId: string): Promise<Session> {
  const res = await fetchWithRetry(`${BASE_URL}/session/create`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ agentId })
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Session create failed: ${res.status}`)
  }
  const data = (await res.json()) as Session
  return data
}

export async function converse(
  sessionId: string,
  message: string
): Promise<{
  agentResponse: Message
  userMessage: Message
}> {
  const res = await fetchWithRetry(
    `${BASE_URL}/session/${sessionId}/converse`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ message, uniqKey: `${sessionId}-${Date.now()}` })
    }
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Converse failed: ${res.status}`)
  }
  const data = (await res.json()) as {
    agentResponse: Message
    userMessage: Message
  }
  return data
}

// Placeholder for message status fetch; adjust endpoint if different on server.
export async function getMessage(
  sessionId: string,
  messageId: string
): Promise<Message> {
  const res = await fetchWithRetry(
    `${BASE_URL}/session/${sessionId}/message/${messageId}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    }
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Message fetch failed: ${res.status}`)
  }
  const data = (await res.json()) as Message
  return data
}

export async function getTranscript(sessionId: string): Promise<Message[]> {
  const res = await fetchWithRetry(
    `${BASE_URL}/session/${sessionId}/transcript`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    }
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Transcript fetch failed: ${res.status}`)
  }
  const data = (await res.json()) as Message[]
  return Array.isArray(data) ? data : []
}
