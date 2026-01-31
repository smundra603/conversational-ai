import { type UsageRow } from 'api/analytics'
import type { TooltipItem } from 'chart.js'
import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'

interface Props {
  rows: UsageRow[]
  currencyFormatter: Intl.NumberFormat
  loading?: boolean
}

const makeBarOptions = (
  title: string,
  valueFormatter?: (v: number) => string
) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
    title: { display: true, text: title },
    tooltip: {
      callbacks: {
        label: (ctx: TooltipItem<'bar'>) => {
          const v = ctx.parsed.y ?? 0
          return valueFormatter ? valueFormatter(v) : String(v)
        }
      }
    }
  }
})

const AgentCharts: React.FC<Props> = ({
  rows,
  currencyFormatter,
  loading = false
}) => {
  const labels = useMemo(() => rows.map((r) => String(r._id ?? '')), [rows])

  const costData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Total Cost',
          data: rows.map((r) => r.total_cost),
          backgroundColor: 'rgba(147, 51, 234, 0.6)'
        }
      ]
    }),
    [labels, rows]
  )

  const tokensData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Total Tokens',
          data: rows.map((r) => r.total_tokens),
          backgroundColor: 'rgba(20, 184, 166, 0.6)'
        }
      ]
    }),
    [labels, rows]
  )

  const sessionsData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Total Sessions',
          data: rows.map((r) => r.total_sessions),
          backgroundColor: 'rgba(244, 63, 94, 0.6)'
        }
      ]
    }),
    [labels, rows]
  )

  return (
    <>
      <h2 className="mb-2 mt-8 text-xl font-semibold">By Agent</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded border p-3">
          <div className="h-80">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Loading agent cost…
              </div>
            ) : (
              <Bar
                options={makeBarOptions('Agent Cost', currencyFormatter.format)}
                data={costData}
              />
            )}
          </div>
        </div>
        <div className="rounded border p-3">
          <div className="h-80">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Loading agent tokens…
              </div>
            ) : (
              <Bar options={makeBarOptions('Agent Tokens')} data={tokensData} />
            )}
          </div>
        </div>
        <div className="rounded border p-3">
          <div className="h-80">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Loading agent sessions…
              </div>
            ) : (
              <Bar
                options={makeBarOptions('Agent Sessions')}
                data={sessionsData}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AgentCharts
