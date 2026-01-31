import { type Session } from 'api/sessions'
import React, { useMemo } from 'react'

interface Props {
  sessions: Session[]
  currentSessionId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  error?: string | null
  onNewSession?: () => void
}

const SessionList: React.FC<Props> = ({
  sessions,
  currentSessionId,
  onSelect,
  loading = false,
  error = null,
  onNewSession
}) => {
  const sorted = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [sessions])

  return (
    <div className="w-72 shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sessions</h2>
        {onNewSession && (
          <button
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            onClick={onNewSession}
          >
            New Session
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {loading && <p className="text-xs text-gray-600">Loading…</p>}
      {sorted.length === 0 ? (
        <div className="rounded border p-4 text-center">
          <p className="mb-2 text-sm text-gray-600">No sessions yet</p>
          {onNewSession && (
            <button
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              onClick={onNewSession}
            >
              Create First Session
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded border">
          {sorted.map((s) => (
            <li key={s._id}>
              <button
                className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 ${
                  currentSessionId === s._id ? 'bg-gray-100' : ''
                }`}
                onClick={() => onSelect(s._id)}
              >
                <span className="text-sm">{s._id}</span>
                <span className="text-xs text-gray-500">
                  {new Date(s.createdAt ?? Date.now()).toLocaleDateString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SessionList
