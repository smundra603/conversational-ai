import { type UsageRow } from 'api/analytics'
import type { TooltipItem } from 'chart.js'
import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'

interface Props {
  rows: UsageRow[]
  titlePrefix?: string
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

const ProviderCharts: React.FC<Props> = ({
  rows,
  titlePrefix = 'Provider',
  currencyFormatter,
  loading = false
}) => {
  const labels = useMemo(
    () => rows.map((r) => String(r._id ?? 'Total')),
    [rows]
  )

  const costData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Total Cost',
          data: rows.map((r) => r.total_cost),
          backgroundColor: 'rgba(37, 99, 235, 0.5)'
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
          backgroundColor: 'rgba(16, 185, 129, 0.5)'
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
          backgroundColor: 'rgba(234, 179, 8, 0.6)'
        }
      ]
    }),
    [labels, rows]
  )

  return (
    <>
      <h2 className="mb-2 text-xl font-semibold">By {titlePrefix}</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded border p-3">
          <div className="h-80">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Loading {titlePrefix.toLowerCase()} cost…
              </div>
            ) : (
              <Bar
                options={makeBarOptions(
                  `${titlePrefix} Cost`,
                  currencyFormatter.format
                )}
                data={costData}
              />
            )}
          </div>
        </div>
        <div className="rounded border p-3">
          <div className="h-80">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Loading {titlePrefix.toLowerCase()} tokens…
              </div>
            ) : (
              <Bar
                options={makeBarOptions(`${titlePrefix} Tokens`)}
                data={tokensData}
              />
            )}
          </div>
        </div>
        <div className="rounded border p-3">
          <div className="h-80">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Loading {titlePrefix.toLowerCase()} sessions…
              </div>
            ) : (
              <Bar
                options={makeBarOptions(`${titlePrefix} Sessions`)}
                data={sessionsData}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProviderCharts
