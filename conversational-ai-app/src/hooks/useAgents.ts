import { listAgents, type Agent } from 'api/agents'
import { useEffect, useRef, useState } from 'react'

let agentsLoadPromise: Promise<Agent[]> | null = null
const loadAgentsSingleFlight = (): Promise<Agent[]> => {
  if (!agentsLoadPromise) {
    agentsLoadPromise = listAgents().finally(() => {
      agentsLoadPromise = null
    })
  }
  return agentsLoadPromise
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    setLoading(true)
    setError(null)
    loadAgentsSingleFlight()
      .then((items) => {
        if (mountedRef.current) setAgents(items)
      })
      .catch((err) => {
        if (mountedRef.current) setError((err as Error).message)
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false)
      })
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await loadAgentsSingleFlight()
      setAgents(items)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return { agents, loading, error, refresh }
}
