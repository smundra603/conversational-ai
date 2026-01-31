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

const TopProvidersChart: React.FC<Props> = ({
  rows,
  currencyFormatter,
  loading = false
}) => {
  const labels = useMemo(() => rows.map((r) => String(r._id ?? '')), [rows])

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Top Providers by Cost',
          data: rows.map((r) => r.total_cost),
          backgroundColor: 'rgba(0, 0, 0, 0.6)'
        }
      ]
    }),
    [labels, rows]
  )

  return (
    <>
      <h2 className="mb-2 mt-8 text-xl font-semibold">Top Providers by Cost</h2>
      <div className="rounded border p-3">
        <div className="h-56">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Loading top providers…
            </div>
          ) : (
            <Bar
              options={makeBarOptions(
                'Top 2 Providers (Cost)',
                currencyFormatter.format
              )}
              data={data}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default TopProvidersChart
