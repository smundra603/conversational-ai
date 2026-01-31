import { type UsageRow } from 'api/analytics'
import React from 'react'

interface Props {
  totals: UsageRow | null
  currencyFormatter: Intl.NumberFormat
}

const TotalsCards: React.FC<Props> = ({ totals, currencyFormatter }) => {
  if (!totals) return null
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded border p-4 shadow-sm">
        <div className="text-sm text-gray-600">Total Cost</div>
        <div className="text-2xl font-semibold">
          {currencyFormatter.format(totals.total_cost || 0)}
        </div>
      </div>
      <div className="rounded border p-4 shadow-sm">
        <div className="text-sm text-gray-600">Total Tokens</div>
        <div className="text-2xl font-semibold">{totals.total_tokens || 0}</div>
      </div>
      <div className="rounded border p-4 shadow-sm">
        <div className="text-sm text-gray-600">Total Sessions</div>
        <div className="text-2xl font-semibold">
          {totals.total_sessions || 0}
        </div>
      </div>
    </div>
  )
}

export default TotalsCards
