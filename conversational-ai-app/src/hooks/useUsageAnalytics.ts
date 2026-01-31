import { usageAnalytics, type UsageRow } from 'api/analytics'
import { useEffect, useMemo, useState } from 'react'

const formatInputDate = (d: Date) => d.toISOString().slice(0, 10)

export const useUsageAnalytics = () => {
  const today = useMemo(() => new Date(), [])
  const defaultEnd = useMemo(() => formatInputDate(today), [today])
  const defaultStart = useMemo(() => {
    const past = new Date(today)
    past.setDate(past.getDate() - 29)
    return formatInputDate(past)
  }, [today])

  const [startDate, setStartDate] = useState<string>(defaultStart)
  const [endDate, setEndDate] = useState<string>(defaultEnd)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingTotals, setLoadingTotals] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [loadingTopProviders, setLoadingTopProviders] = useState(false)

  const [totals, setTotals] = useState<UsageRow | null>(null)
  const [byProvider, setByProvider] = useState<UsageRow[]>([])
  const [byAgent, setByAgent] = useState<UsageRow[]>([])
  const [topProvidersCost, setTopProvidersCost] = useState<UsageRow[]>([])

  const filters = useMemo(() => {
    const startIso = new Date(`${startDate}T00:00:00Z`).toISOString()
    const endIso = new Date(`${endDate}T23:59:59Z`).toISOString()
    return { startDate: startIso, endDate: endIso }
  }, [startDate, endDate])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setLoadingTotals(true)
      setLoadingProviders(true)
      setLoadingAgents(true)
      setLoadingTopProviders(true)
      try {
        // Load sequentially: totals → providers → agents → top providers
        const totalRows = await usageAnalytics({
          filters,
          metrics: ['total_cost', 'total_sessions', 'total_tokens']
        })
        if (cancelled) return
        setTotals(totalRows[0] ?? null)
        setLoadingTotals(false)

        const providerRows = await usageAnalytics({
          filters,
          metrics: ['total_cost', 'total_sessions', 'total_tokens'],
          dimension: 'provider'
        })
        if (cancelled) return
        setByProvider(providerRows)
        setLoadingProviders(false)

        const agentRows = await usageAnalytics({
          filters,
          metrics: ['total_cost', 'total_sessions', 'total_tokens'],
          dimension: 'agentId'
        })
        if (cancelled) return
        setByAgent(agentRows)
        setLoadingAgents(false)

        const topCost = await usageAnalytics({
          filters,
          metrics: ['total_cost'],
          dimension: 'provider',
          topN: { n: 2, property: 'total_cost' }
        })
        if (cancelled) return
        setTopProvidersCost(topCost)
        setLoadingTopProviders(false)
      } catch (err) {
        if (cancelled) return
        setError((err as Error).message)
        setLoadingTotals(false)
        setLoadingProviders(false)
        setLoadingAgents(false)
        setLoadingTopProviders(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [filters])

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 5
      }),
    []
  )

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    loading,
    error,
    loadingTotals,
    loadingProviders,
    loadingAgents,
    loadingTopProviders,
    totals,
    byProvider,
    byAgent,
    topProvidersCost,
    currencyFormatter
  }
}
