const BASE_URL = 'http://localhost:3000'
import { fetchWithRetry } from './http'

export type ProviderId = string

export type Agent = {
  _id: string
  name: string
  primaryProvider: ProviderId
  fallbackProvider?: ProviderId
  prompt: string
  createdAt?: string
  updatedAt?: string
}

export async function getProviders(): Promise<ProviderId[]> {
  const res = await fetchWithRetry(`${BASE_URL}/public/providers`, {
    method: 'GET',
    credentials: 'include'
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Providers fetch failed: ${res.status}`)
  }
  const data = (await res.json()) as { providers: ProviderId[] }
  return data.providers
}

export async function listAgents(params?: {
  name?: string
  primaryProvider?: ProviderId
  fallbackProvider?: ProviderId
}): Promise<Agent[]> {
  const query = new URLSearchParams()
  if (params?.name) query.set('name', params.name)
  if (params?.primaryProvider)
    query.set('primaryProvider', params.primaryProvider)
  if (params?.fallbackProvider)
    query.set('fallbackProvider', params.fallbackProvider)
  const res = await fetchWithRetry(
    `${BASE_URL}/agent/list${query.toString() ? `?${query.toString()}` : ''}`,
    {
      method: 'GET',
      credentials: 'include'
    }
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Agents fetch failed: ${res.status}`)
  }
  const data = (await res.json()) as { agents: Agent[] }
  return data.agents
}

export async function registerAgent(input: {
  name: string
  primaryProvider: ProviderId
  fallbackProvider?: ProviderId
  prompt: string
}): Promise<Agent> {
  const res = await fetchWithRetry(`${BASE_URL}/agent/register`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(input)
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Agent register failed: ${res.status}`)
  }
  const data = (await res.json()) as Agent
  return data
}

export async function configureAgent(
  id: string,
  updates: Partial<
    Pick<Agent, 'name' | 'primaryProvider' | 'fallbackProvider' | 'prompt'>
  >
): Promise<Agent> {
  const res = await fetchWithRetry(`${BASE_URL}/agent/${id}/configure`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(updates)
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Agent configure failed: ${res.status}`)
  }
  const data = (await res.json()) as Agent
  return data
}
