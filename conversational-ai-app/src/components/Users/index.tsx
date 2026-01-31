import Button from 'components/common/Button'
import SearchBar from 'components/common/SearchBar'
import { useUsers } from 'hooks/useUsers'
import React from 'react'
import CreateUserModal from './CreateUserModal'

const roleOptions = [
  { label: 'User', value: 'user' as const },
  { label: 'Admin', value: 'admin' as const }
]

const Users: React.FC = () => {
  const {
    users,
    loading,
    error,
    searchText,
    setSearchText,
    selectedRoles,
    setSelectedRoles,
    creating,
    createError,
    addUser,
    editUser
  } = useUsers()
  const [createOpen, setCreateOpen] = React.useState(false)

  const onRoleToggle = (value: 'user' | 'admin') => {
    setSelectedRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-2xl font-semibold">Users</h1>

        {/* Top controls: left filters, right create button */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <SearchBar
                  value={searchText}
                  onChange={setSearchText}
                  placeholder="Search by name…"
                />
              </div>
              <div className="flex items-center gap-3">
                {roleOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(opt.value)}
                      onChange={() => onRoleToggle(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="sm:ml-4">
            <Button onClick={() => setCreateOpen(true)}>Create User</Button>
          </div>
        </div>

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={createOpen}
          creating={creating}
          error={createError}
          onCreate={addUser}
          onClose={() => setCreateOpen(false)}
        />

        {/* List */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && users.length === 0 && (
          <p className="text-sm text-gray-600">Loading…</p>
        )}
        {!loading && users.length === 0 && (
          <div className="rounded border p-6 text-center">
            <p className="text-sm text-gray-600">No users found.</p>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Roles
              </th>
              {/* Actions column removed */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded border px-2 py-1"
                    defaultValue={u.name}
                    onBlur={(e) => {
                      const val = e.target.value.trim()
                      if (val && val !== u.name) {
                        editUser(u._id, { name: val })
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2">
                  <span className="text-sm text-gray-700">{u.emailId}</span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    {roleOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={u.roles.includes(opt.value)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? Array.from(new Set([...u.roles, opt.value]))
                              : u.roles.filter((r) => r !== opt.value)
                            editUser(u._id, { roles: next })
                          }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </td>
                {/* Actions column removed */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users
