import { type ProviderId } from 'api/agents'
import Button from 'components/common/Button'
import Modal from 'components/common/Modal'
import React, { useState } from 'react'

interface Props {
  isOpen: boolean
  providers: ProviderId[]
  adding: boolean
  addError: string | null
  onAdd: (input: {
    name: string
    primaryProvider: ProviderId
    fallbackProvider?: ProviderId | ''
    prompt: string
  }) => Promise<void>
  onClose: () => void
}

const AddAgentModal: React.FC<Props> = ({
  isOpen,
  providers,
  adding,
  addError,
  onAdd,
  onClose
}) => {
  const [newName, setNewName] = useState('')
  const [newPrimary, setNewPrimary] = useState<ProviderId | ''>('')
  const [newFallback, setNewFallback] = useState<ProviderId | ''>('')
  const [newPrompt, setNewPrompt] = useState('')

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!newPrimary) return
    await onAdd({
      name: newName,
      primaryProvider: newPrimary as ProviderId,
      fallbackProvider: newFallback,
      prompt: newPrompt
    })
    setNewName('')
    setNewPrimary('')
    setNewFallback('')
    setNewPrompt('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Add Agent"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            form="add-agent-form"
            type="submit"
            variant="primary"
            size="sm"
            disabled={adding}
          >
            {adding ? 'Adding…' : 'Add Agent'}
          </Button>
        </div>
      }
    >
      <form id="add-agent-form" onSubmit={onSubmit} className="space-y-3">
        {addError && <p className="text-sm text-red-600">{addError}</p>}
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Name</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">
            Primary Provider
          </span>
          <select
            value={newPrimary}
            onChange={(e) => setNewPrimary(e.target.value as ProviderId | '')}
            className="w-full rounded border px-3 py-2"
            required
          >
            <option value="" disabled>
              Select a provider
            </option>
            {providers.map((p) => (
              <option key={`new-primary-${p}`} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">
            Fallback Provider (optional)
          </span>
          <select
            value={newFallback}
            onChange={(e) => setNewFallback(e.target.value as ProviderId | '')}
            className="w-full rounded border px-3 py-2"
          >
            <option value="">None</option>
            {providers.map((p) => (
              <option key={`new-fallback-${p}`} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Prompt</span>
          <textarea
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            rows={4}
            className="w-full rounded border px-3 py-2"
            placeholder="You are a helpful assistant."
            required
          />
        </label>
      </form>
    </Modal>
  )
}

export default AddAgentModal
