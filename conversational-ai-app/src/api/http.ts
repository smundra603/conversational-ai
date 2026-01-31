import { refreshAccessToken } from './auth'

// Single-flight guard: ensures only one refresh runs at a time
let refreshingPromise: Promise<void> | null = null

async function ensureRefreshedOnce(): Promise<boolean> {
  if (!refreshingPromise) {
    refreshingPromise = refreshAccessToken().finally(() => {
      refreshingPromise = null
    })
  }
  try {
    await refreshingPromise
    return true
  } catch {
    return false
  }
}

type Input = Parameters<typeof fetch>[0]
type Init = Parameters<typeof fetch>[1]

export async function fetchWithRetry(
  input: Input,
  init?: Init
): Promise<Response> {
  const first = await fetch(input, {
    credentials: 'include',
    ...init
  })
  if (first.status !== 401) return first
  // Attempt a token refresh using HttpOnly cookies; coalesce parallel calls
  const refreshed = await ensureRefreshedOnce()
  if (!refreshed) {
    // Refresh failed; return original 401 response
    return first
  }
  // Retry once after successful refresh
  const second = await fetch(input, {
    credentials: 'include',
    ...init
  })
  return second
}
