import { type Agent, type ProviderId } from 'api/agents'
import Button from 'components/common/Button'
import Modal from 'components/common/Modal'
import React, { useEffect, useState } from 'react'

interface Props {
  isOpen: boolean
  agent: Agent | null
  providers: ProviderId[]
  updating: boolean
  error: string | null
  onSave: (
    id: string,
    updates: Partial<
      Pick<Agent, 'name' | 'primaryProvider' | 'fallbackProvider' | 'prompt'>
    >
  ) => Promise<void>
  onClose: () => void
}

const EditAgentModal: React.FC<Props> = ({
  isOpen,
  agent,
  providers,
  updating,
  error,
  onSave,
  onClose
}) => {
  const [name, setName] = useState('')
  const [primary, setPrimary] = useState<ProviderId | ''>('')
  const [fallback, setFallback] = useState<ProviderId | ''>('')
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    if (!agent) return
    setName(agent.name)
    setPrimary(agent.primaryProvider)
    setFallback(agent.fallbackProvider ?? '')
    setPrompt(agent.prompt)
  }, [agent])

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!agent) return
    const updates: Partial<
      Pick<Agent, 'name' | 'primaryProvider' | 'fallbackProvider' | 'prompt'>
    > = {}
    if (name && name !== agent.name) updates.name = name
    if (primary && primary !== agent.primaryProvider)
      updates.primaryProvider = primary
    // Allow unset fallback provider
    if (fallback !== (agent.fallbackProvider ?? '')) {
      updates.fallbackProvider = fallback || undefined
    }
    if (prompt && prompt !== agent.prompt) updates.prompt = prompt
    await onSave(agent._id, updates)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Edit Agent"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            form="edit-agent-form"
            type="submit"
            variant="primary"
            size="sm"
            disabled={updating}
          >
            {updating ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <form id="edit-agent-form" onSubmit={onSubmit} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">
            Primary Provider
          </span>
          <select
            value={primary}
            onChange={(e) => setPrimary(e.target.value as ProviderId | '')}
            className="w-full rounded border px-3 py-2"
          >
            <option value="" disabled>
              Select a provider
            </option>
            {providers.map((p) => (
              <option key={`edit-primary-${p}`} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">
            Fallback Provider
          </span>
          <select
            value={fallback}
            onChange={(e) => setFallback(e.target.value as ProviderId | '')}
            className="w-full rounded border px-3 py-2"
          >
            <option value="">None</option>
            {providers.map((p) => (
              <option key={`edit-fallback-${p}`} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Prompt</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded border px-3 py-2"
            placeholder="You are a helpful assistant."
          />
        </label>
      </form>
    </Modal>
  )
}

export default EditAgentModal
