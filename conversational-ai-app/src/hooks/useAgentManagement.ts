import {
  configureAgent,
  getProviders,
  listAgents,
  registerAgent,
  type Agent,
  type ProviderId
} from 'api/agents'
import { useEffect, useMemo, useState } from 'react'

export const useAgentManagement = () => {
  const [providers, setProviders] = useState<ProviderId[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [primaryProvider, setPrimaryProvider] = useState<ProviderId | ''>('')
  const [fallbackProvider, setFallbackProvider] = useState<ProviderId | ''>('')

  // Add Agent state
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Load providers once
  useEffect(() => {
    let mounted = true
    getProviders()
      .then((p) => {
        if (!mounted) return
        setProviders(p)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Debounced search text
  const debouncedSearch = useMemo(() => search.trim(), [search])

  // Fetch agents when filters change
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      listAgents({
        name: debouncedSearch || undefined,
        primaryProvider: primaryProvider || undefined,
        fallbackProvider: fallbackProvider || undefined
      })
        .then((items) => {
          setAgents(items)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }, 250)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [debouncedSearch, primaryProvider, fallbackProvider])

  const refreshAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await listAgents({
        name: debouncedSearch || undefined,
        primaryProvider: primaryProvider || undefined,
        fallbackProvider: fallbackProvider || undefined
      })
      setAgents(items)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  type NewAgentInput = {
    name: string
    primaryProvider: ProviderId
    fallbackProvider?: ProviderId | ''
    prompt: string
  }

  const addAgent = async ({
    name,
    primaryProvider,
    fallbackProvider,
    prompt
  }: NewAgentInput) => {
    setAddError(null)
    setAdding(true)
    const optimistic: Agent = {
      _id: `temp-${Date.now()}`,
      name,
      primaryProvider,
      fallbackProvider: fallbackProvider || undefined,
      prompt,
      createdAt: new Date().toISOString()
    }
    setAgents((prev) => [optimistic, ...prev])
    try {
      const created = await registerAgent({
        name: optimistic.name,
        primaryProvider: optimistic.primaryProvider,
        fallbackProvider: optimistic.fallbackProvider,
        prompt: optimistic.prompt
      })
      setAgents((prev) => {
        const idx = prev.findIndex((a) => a._id === optimistic._id)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = created
        return next
      })
    } catch (err) {
      setAddError((err as Error).message)
      setAgents((prev) => prev.filter((a) => a._id !== optimistic._id))
      throw err
    } finally {
      setAdding(false)
    }
  }

  const editAgent = async (
    id: string,
    updates: Partial<
      Pick<Agent, 'name' | 'primaryProvider' | 'fallbackProvider' | 'prompt'>
    >
  ) => {
    setUpdateError(null)
    setUpdatingId(id)
    try {
      const updated = await configureAgent(id, updates)
      setAgents((prev) => prev.map((a) => (a._id === id ? updated : a)))
    } catch (err) {
      setUpdateError((err as Error).message)
      throw err
    } finally {
      setUpdatingId(null)
    }
  }

  return {
    providers,
    agents,
    loading,
    error,
    search,
    setSearch,
    primaryProvider,
    setPrimaryProvider,
    fallbackProvider,
    setFallbackProvider,
    adding,
    addError,
    addAgent,
    refreshAgents,
    editAgent,
    updatingId,
    updateError
  }
}
