import {
  createUser,
  listUsers,
  updateUser,
  type Role,
  type User
} from 'api/users'
import { useEffect, useMemo, useState } from 'react'

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchText, setSearchText] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([])

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const debouncedSearch = useMemo(() => searchText.trim(), [searchText])

  useEffect(() => {
    let mounted = true
    setError(null)
    const timer = setTimeout(() => {
      if (!mounted) return
      setLoading(true)
      listUsers({
        searchText: debouncedSearch || undefined,
        roles: selectedRoles
      })
        .then((list) => mounted && setUsers(list))
        .catch((err) => mounted && setError((err as Error).message))
        .finally(() => mounted && setLoading(false))
    }, 250)
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [debouncedSearch, selectedRoles])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listUsers({
        searchText: debouncedSearch || undefined,
        roles: selectedRoles
      })
      setUsers(list)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (input: {
    name: string
    emailId: string
    roles?: Role[]
  }) => {
    setCreateError(null)
    setCreating(true)
    try {
      const created = await createUser(input)
      setUsers((prev) => [created, ...prev])
    } catch (err) {
      setCreateError((err as Error).message)
      throw err
    } finally {
      setCreating(false)
    }
  }

  const editUser = async (
    id: string,
    updates: Partial<Pick<User, 'name' | 'roles'>>
  ) => {
    setUpdateError(null)
    setUpdatingId(id)
    try {
      const updated = await updateUser(id, updates)
      setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)))
    } catch (err) {
      setUpdateError((err as Error).message)
      throw err
    } finally {
      setUpdatingId(null)
    }
  }

  return {
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
    updatingId,
    updateError,
    editUser,
    refresh
  }
}
