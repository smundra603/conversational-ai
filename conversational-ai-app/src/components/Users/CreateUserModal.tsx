import type { Role } from 'api/users'
import Button from 'components/common/Button'
import Modal from 'components/common/Modal'
import React from 'react'

type Props = {
  isOpen: boolean
  creating: boolean
  error: string | null
  onCreate: (input: {
    name: string
    emailId: string
    roles?: Role[]
  }) => Promise<void>
  onClose: () => void
}

const roleOptions: { label: string; value: Role }[] = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' }
]

const CreateUserModal: React.FC<Props> = ({
  isOpen,
  creating,
  error,
  onCreate,
  onClose
}) => {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [roles, setRoles] = React.useState<Role[]>(['user'])

  const onRoleToggle = (value: Role) => {
    setRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    )
  }

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    await onCreate({ name: name.trim(), emailId: email.trim(), roles })
    setName('')
    setEmail('')
    setRoles(['user'])
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Create User"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            form="create-user-form"
            type="submit"
            variant="primary"
            size="sm"
            disabled={creating}
          >
            {creating ? 'Creating…' : 'Create User'}
          </Button>
        </div>
      }
    >
      <form id="create-user-form" onSubmit={onSubmit} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </label>
        <div>
          <span className="mb-1 block text-sm text-gray-600">Roles</span>
          <div className="flex items-center gap-3">
            {roleOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={roles.includes(opt.value)}
                  onChange={() => onRoleToggle(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default CreateUserModal
