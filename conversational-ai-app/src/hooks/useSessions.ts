import { listSessions, type Session } from 'api/sessions'
import { useEffect, useState } from 'react'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const inflightKey = 'sessions:list:inflight'
    if (sessionStorage.getItem(inflightKey) === 'true') return
    sessionStorage.setItem(inflightKey, 'true')
    setLoading(true)
    setError(null)
    listSessions()
      .then((items) => setSessions(Array.isArray(items) ? items : []))
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false)
        sessionStorage.removeItem(inflightKey)
      })
  }, [])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await listSessions()
      setSessions(Array.isArray(items) ? items : [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return { sessions, loading, error, refresh }
}
