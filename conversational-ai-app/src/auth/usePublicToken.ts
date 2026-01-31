import { fetchPublicToken } from 'api/auth'
import { useCallback, useRef } from 'react'

// Single-flight to dedupe concurrent calls across mounts
let publicTokenPromise: Promise<void> | null = null
function fetchPublicOnce(): Promise<void> {
  if (!publicTokenPromise) {
    publicTokenPromise = fetchPublicToken().finally(() => {
      publicTokenPromise = null
    })
  }
  return publicTokenPromise
}

export function usePublicTokenBootstrap() {
  const calledRef = useRef(false)

  const ensurePublicTokenMissingOnce = useCallback(async () => {
    if (calledRef.current) return
    calledRef.current = true
    try {
      await fetchPublicOnce()
    } finally {
      // keep calledRef true within this mount to avoid repeat
    }
  }, [])

  const resetPublicGuard = useCallback(() => {
    calledRef.current = false
  }, [])

  return { ensurePublicTokenMissingOnce, resetPublicGuard }
}
