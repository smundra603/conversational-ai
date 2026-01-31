import { logout, ssoAuth } from 'api/auth'
import { getMe } from 'api/users'
import { getCookie } from 'auth/cookies'
import { usePublicTokenBootstrap } from 'auth/usePublicToken'
import { useTokenRefresh } from 'auth/useTokenRefresh'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

export type AuthUser = { _id: string; name: string }

type AuthContextValue = {
  user: AuthUser | null
  authorized: boolean
  authorizeSSO: (params: {
    domain: string
    apiKey: string
    emailId: string
  }) => Promise<void>
  signOut: () => void
  hasScope: (scope: string) => boolean
  hasAnyScope: (scopes: string[]) => boolean
}

const STORAGE_KEY = 'auth:user'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children
}) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [scopes, setScopes] = useState<string[]>([])

  const initStartedRef = useRef(false)
  const publicTokenFetchRef = useRef(false)

  const { scheduleRefresh, clearRefreshTimer } = useTokenRefresh({
    onRefreshFail: () => {
      setAuthorized(false)
      try {
        localStorage.removeItem('auth:authorized')
      } catch {
        // ignore
      }
    }
  })
  const { ensurePublicTokenMissingOnce, resetPublicGuard } =
    usePublicTokenBootstrap()

  useEffect(() => {
    if (initStartedRef.current) return
    initStartedRef.current = true
    let isAuthorized = false
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser
        setUser(parsed)
      }
      const rawAuth = localStorage.getItem('auth:authorized')
      if (rawAuth === 'true') {
        setAuthorized(true)
        isAuthorized = true
      }
    } catch {
      // ignore
    }
    // Only fetch public token if not authorized
    const token = getCookie('accessToken')
    if (!isAuthorized && !token) {
      if (!publicTokenFetchRef.current) {
        publicTokenFetchRef.current = true
        ensurePublicTokenMissingOnce().finally(() => setInitialized(true))
      } else {
        setInitialized(true)
      }
    } else {
      setInitialized(true)
    }
    // If already authorized, schedule refresh; authorized effect will populate scopes
    if (isAuthorized) {
      scheduleRefresh()
    }
  }, [scheduleRefresh, ensurePublicTokenMissingOnce])

  useEffect(() => {
    if (!authorized) return
    getMe()
      .then((me) => {
        setUser({ _id: me._id, name: me.name })
        setScopes(me.scopes ?? [])
      })
      .catch(() => void 0)
  }, [authorized])

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [user])

  const authorizeSSO = useCallback(
    async (params: { domain: string; apiKey: string; emailId: string }) => {
      const res = await ssoAuth(params)
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `SSO auth failed: ${res.status}`)
      }
      // Mark session authorized; we are not using user details currently
      setAuthorized(true)
      try {
        localStorage.setItem('auth:authorized', 'true')
        // Set access token expiry to 50 minutes from now for client-side scheduling
        const fiftyMinsMs = 50 * 60 * 1000
        localStorage.setItem('auth:accessExp', String(Date.now() + fiftyMinsMs))
      } catch {
        // ignore
      }
      // After successful SSO, schedule token refresh
      scheduleRefresh()
    },
    [scheduleRefresh]
  )

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem('auth:authorized')
      localStorage.removeItem('auth:accessExp')
    } catch {
      // ignore
    }
    clearRefreshTimer()
    // Call backend logout to clear cookies server-side
    logout().catch(() => void 0)
    setUser(null)
    setAuthorized(false)
    setScopes([])
    // After logout, ensure we have a public token again
    publicTokenFetchRef.current = false
    resetPublicGuard()
    if (!getCookie('accessToken')) {
      publicTokenFetchRef.current = true
      ensurePublicTokenMissingOnce().catch(() => void 0)
    }
  }, [clearRefreshTimer, ensurePublicTokenMissingOnce, resetPublicGuard])

  const getScopes = useCallback((): string[] => {
    return scopes
  }, [scopes])

  const hasScope = useCallback(
    (scope: string) => {
      return getScopes().includes(scope)
    },
    [getScopes]
  )

  const hasAnyScope = useCallback(
    (scopes: string[]) => {
      const current = getScopes()
      return scopes.some((s) => current.includes(s))
    },
    [getScopes]
  )

  const value = useMemo(
    () => ({ user, authorized, authorizeSSO, signOut, hasScope, hasAnyScope }),
    [user, authorized, authorizeSSO, signOut, hasScope, hasAnyScope]
  )

  // Delay rendering until the public token check completes to avoid flicker
  if (!initialized) {
    return null
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
