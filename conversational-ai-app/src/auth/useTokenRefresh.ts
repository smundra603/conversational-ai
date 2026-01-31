import { refreshAccessToken } from 'api/auth'
import { useCallback, useEffect, useRef } from 'react'

export function useTokenRefresh(options: { onRefreshFail: () => void }) {
  const refreshTimerRef = useRef<number | null>(null)

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  const ACCESS_EXP_KEY = 'auth:accessExp'
  const ACCESS_TTL_MS = 50 * 60 * 1000 // 50 minutes
  const REFRESH_LEEWAY_MS = 5 * 60 * 1000 // refresh when within 5 minutes

  const readAccessExp = (): number | null => {
    try {
      const raw = localStorage.getItem(ACCESS_EXP_KEY)
      if (!raw) return null
      const num = Number(raw)
      return Number.isFinite(num) ? num : null
    } catch {
      return null
    }
  }

  const writeAccessExp = (ms: number) => {
    try {
      localStorage.setItem(ACCESS_EXP_KEY, String(ms))
    } catch {
      // ignore
    }
  }

  const scheduleRefresh = useCallback(() => {
    clearRefreshTimer()
    const now = Date.now()
    let exp = readAccessExp()
    // If missing, initialize to 50 mins from now
    if (!exp) {
      exp = now + ACCESS_TTL_MS
      writeAccessExp(exp)
    }
    const delay = Math.max(0, exp - now - REFRESH_LEEWAY_MS)
    const tick = async () => {
      try {
        await refreshAccessToken()
        const nextExp = Date.now() + ACCESS_TTL_MS
        writeAccessExp(nextExp)
        const nextDelay = Math.max(0, nextExp - Date.now() - REFRESH_LEEWAY_MS)
        refreshTimerRef.current = window.setTimeout(tick, nextDelay)
      } catch {
        options.onRefreshFail()
      }
    }
    refreshTimerRef.current = window.setTimeout(tick, delay)
  }, [clearRefreshTimer, options, ACCESS_TTL_MS, REFRESH_LEEWAY_MS])

  // Best-effort: refresh when tab becomes visible and within 5 mins of expiry
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const exp = readAccessExp()
        const now = Date.now()
        if (exp && exp - now <= REFRESH_LEEWAY_MS) {
          refreshAccessToken()
            .then(() => {
              const nextExp = Date.now() + ACCESS_TTL_MS
              writeAccessExp(nextExp)
            })
            .catch(() => options.onRefreshFail())
        }
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [options, ACCESS_TTL_MS, REFRESH_LEEWAY_MS])

  return { scheduleRefresh, clearRefreshTimer }
}
