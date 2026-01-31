import { type Agent } from 'api/agents'
import Button from 'components/common/Button'
import Modal from 'components/common/Modal'
import React, { useEffect, useRef, useState } from 'react'

interface Props {
  isOpen: boolean
  agents: Agent[]
  agentsLoading?: boolean
  onRefreshAgents: () => Promise<void>
  onCreateSession: (agentId: string) => Promise<void>
  onClose: () => void
  onAddAgentClick?: () => void
}

const NewSessionModal: React.FC<Props> = ({
  isOpen,
  agents,
  agentsLoading = false,
  onRefreshAgents,
  onCreateSession,
  onClose,
  onAddAgentClick
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const requestedOnOpen = useRef(false)
  useEffect(() => {
    if (!isOpen) {
      requestedOnOpen.current = false
      return
    }
    if (requestedOnOpen.current) return
    requestedOnOpen.current = true
    if (agents.length === 0 && !agentsLoading) {
      onRefreshAgents().catch(() => void 0)
    }
  }, [isOpen, agents.length, agentsLoading, onRefreshAgents])

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!selectedAgentId) return
    setAddError(null)
    setAdding(true)
    try {
      await onCreateSession(selectedAgentId)
      setSelectedAgentId('')
    } catch (err) {
      setAddError((err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Start New Session"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            form="create-session-form"
            type="submit"
            variant="primary"
            size="sm"
            disabled={adding || !selectedAgentId}
          >
            {adding ? 'Starting…' : 'Start'}
          </Button>
        </div>
      }
    >
      <form id="create-session-form" onSubmit={onSubmit} className="space-y-3">
        {addError && <p className="text-sm text-red-600">{addError}</p>}
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Agent</span>
          <select
            value={selectedAgentId}
            onChange={(e) => {
              const val = e.target.value
              if (val === '__add__') {
                onAddAgentClick?.()
                // Reset selection so form remains invalid until a real agent is chosen
                setSelectedAgentId('')
                return
              }
              setSelectedAgentId(val)
            }}
            className="w-full rounded border px-3 py-2"
            required
          >
            <option value="" disabled>
              Select an agent
            </option>
            {agents.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} ({a.primaryProvider}
                {a.fallbackProvider ? ` → ${a.fallbackProvider}` : ''})
              </option>
            ))}
            {onAddAgentClick && (
              // Keep conditional single child for formatter
              <option value="__add__">Add new agent…</option>
            )}
          </select>
        </label>
        {/* <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {agentsLoading
              ? 'Loading agents…'
              : agents.length === 0
                ? 'No agents found.'
                : ''}
          </span>
        </div> */}
      </form>
    </Modal>
  )
}

export default NewSessionModal
