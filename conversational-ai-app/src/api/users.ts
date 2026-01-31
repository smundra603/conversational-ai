const BASE_URL = 'http://localhost:3000'
import { fetchWithRetry } from './http'

export type Role = 'user' | 'admin'

export type User = {
  _id: string
  name: string
  emailId: string
  status: 'active' | 'inactive'
  roles: Role[]
  createdAt?: string
  updatedAt?: string
}

export type Me = User & { scopes?: string[] }

export async function listUsers(params?: {
  searchText?: string
  roles?: Role[]
}): Promise<User[]> {
  const query = new URLSearchParams()
  if (params?.searchText) query.set('searchText', params.searchText)
  if (params?.roles && params.roles.length > 0) {
    params.roles.forEach((r) => query.append('roles', r))
  }
  const res = await fetchWithRetry(
    `${BASE_URL}/user/list${query.toString() ? `?${query.toString()}` : ''}`,
    {
      method: 'GET',
      credentials: 'include'
    }
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Users fetch failed: ${res.status}`)
  }
  const data = (await res.json()) as { users: User[] }
  return data.users
}

export async function createUser(input: {
  name: string
  emailId: string
  roles?: Role[]
}): Promise<User> {
  const res = await fetchWithRetry(`${BASE_URL}/user/create`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(input)
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `User create failed: ${res.status}`)
  }
  return (await res.json()) as User
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, 'name' | 'roles'>>
): Promise<User> {
  const res = await fetchWithRetry(`${BASE_URL}/user/${id}/update`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(updates)
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `User update failed: ${res.status}`)
  }
  return (await res.json()) as User
}

export async function getMe(): Promise<Me> {
  const res = await fetchWithRetry(`${BASE_URL}/user/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Get me failed: ${res.status}`)
  }
  return (await res.json()) as Me
}
