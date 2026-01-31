const BASE_URL = 'http://localhost:3000'
import { fetchWithRetry } from './http'

export type UsageRow = {
  _id: string | null
  total_cost: number
  total_tokens: number
  total_sessions: number
}

export async function usageAnalytics(params: {
  filters?: { startDate?: string; endDate?: string }
  metrics: Array<'total_cost' | 'total_sessions' | 'total_tokens'>
  dimension?: 'provider' | 'agentId'
  topN?: {
    n: number
    property: 'total_cost' | 'total_sessions' | 'total_tokens'
  }
}): Promise<UsageRow[]> {
  const res = await fetchWithRetry(`${BASE_URL}/analytics/usage`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(params)
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Usage analytics failed: ${res.status}`)
  }
  const data = (await res.json()) as UsageRow[]
  return Array.isArray(data) ? data : []
}
