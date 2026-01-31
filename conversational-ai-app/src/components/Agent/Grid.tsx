import { type Agent } from 'api/agents'
import React from 'react'

interface Props {
  agents: Agent[]
  loading?: boolean
  error?: string | null
  onAddAgent?: () => void
  onEditAgent?: (agent: Agent) => void
}

const Grid: React.FC<Props> = ({
  agents,
  loading = false,
  error = null,
  onAddAgent,
  onEditAgent
}) => {
  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-600">Loading…</p>}
      {!loading && agents.length === 0 && (
        <div className="rounded border p-6 text-center">
          <p className="mb-3 text-sm text-gray-600">No agents found.</p>
          {onAddAgent && (
            <button
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              onClick={onAddAgent}
            >
              Add Agent
            </button>
          )}
        </div>
      )}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => (
          <li key={a._id} className="rounded border p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{a.name}</h3>
              <span className="text-xs text-gray-500">
                {new Date(a.createdAt ?? Date.now()).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              <div>
                <span className="font-medium">Primary:</span>{' '}
                {a.primaryProvider}
              </div>
              {a.fallbackProvider && (
                <div>
                  <span className="font-medium">Fallback:</span>{' '}
                  {a.fallbackProvider}
                </div>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
              {a.prompt}
            </p>
            {onEditAgent && (
              <div className="mt-3 text-right">
                <button
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                  onClick={() => onEditAgent(a)}
                >
                  Edit
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

export default Grid
