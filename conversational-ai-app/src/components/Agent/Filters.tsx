import { type ProviderId } from 'api/agents'
import SearchBar from 'components/common/SearchBar'
import React from 'react'

interface Props {
  search: string
  onSearchChange: (value: string) => void
  primaryProvider: ProviderId | ''
  onPrimaryChange: (value: ProviderId | '') => void
  fallbackProvider: ProviderId | ''
  onFallbackChange: (value: ProviderId | '') => void
  providers: ProviderId[]
}

const Filters: React.FC<Props> = ({
  search,
  onSearchChange,
  primaryProvider,
  onPrimaryChange,
  fallbackProvider,
  onFallbackChange,
  providers
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-64">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Search by name"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Primary Provider</span>
        <select
          value={primaryProvider}
          onChange={(e) => onPrimaryChange(e.target.value as ProviderId | '')}
          className="rounded border px-3 py-2"
        >
          <option value="">All Providers</option>
          {providers.map((p) => (
            <option key={`primary-${p}`} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Fallback Provider</span>
        <select
          value={fallbackProvider}
          onChange={(e) => onFallbackChange(e.target.value as ProviderId | '')}
          className="rounded border px-3 py-2"
        >
          <option value="">All Fallbacks</option>
          {providers.map((p) => (
            <option key={`fallback-${p}`} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default Filters
