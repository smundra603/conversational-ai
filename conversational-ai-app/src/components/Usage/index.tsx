import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js'
import DateRangeFilter, {
  type DateRangePreset
} from 'components/common/DateRangeFilter'
import { useUsageAnalytics } from 'hooks/useUsageAnalytics'
import AgentCharts from './AgentCharts'
import ProviderCharts from './ProviderCharts'
import TopProvidersChart from './TopProvidersChart'
import TotalsCards from './TotalsCards'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const Usage = () => {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    loading,
    error,
    loadingProviders,
    loadingAgents,
    loadingTopProviders,
    totals,
    byProvider,
    byAgent,
    topProvidersCost,
    currencyFormatter
  } = useUsageAnalytics()

  const formatInputDate = (d: Date) => d.toISOString().slice(0, 10)
  const presets: DateRangePreset[] = [
    {
      label: 'Last 7 days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 6)
        return { start: formatInputDate(start), end: formatInputDate(end) }
      }
    },
    {
      label: 'Last 30 days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 29)
        return { start: formatInputDate(start), end: formatInputDate(end) }
      }
    },
    {
      label: 'Last 90 days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 89)
        return { start: formatInputDate(start), end: formatInputDate(end) }
      }
    },
    {
      label: 'This month',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = now
        return { start: formatInputDate(start), end: formatInputDate(end) }
      }
    }
  ]

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          presets={presets}
          className="mb-4"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-gray-600">Loading analytics…</p>}

        <TotalsCards totals={totals} currencyFormatter={currencyFormatter} />

        <ProviderCharts
          rows={byProvider}
          currencyFormatter={currencyFormatter}
          loading={loadingProviders}
        />

        <AgentCharts
          rows={byAgent}
          currencyFormatter={currencyFormatter}
          loading={loadingAgents}
        />

        <TopProvidersChart
          rows={topProvidersCost}
          currencyFormatter={currencyFormatter}
          loading={loadingTopProviders}
        />
      </div>
    </div>
  )
}

export default Usage
