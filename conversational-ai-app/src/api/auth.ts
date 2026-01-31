const BASE_URL = 'http://localhost:3000'

export async function fetchPublicToken(): Promise<void> {
  const res = await fetch(`${BASE_URL}/public/public-token`, {
    method: 'GET',
    credentials: 'include'
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Public token fetch failed: ${res.status} ${text}`)
  }
}

export async function ssoAuth(params: {
  domain: string
  apiKey: string
  emailId: string
}): Promise<Response> {
  // const query = new URLSearchParams({
  //   domain: params.domain,
  //   apiKey: params.apiKey,
  //   emailId: params.emailId
  // })
  const res = await fetch(`${BASE_URL}/auth/sso`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  })
  return res
}

export async function createTenant(params: {
  adminEmail: string
  domain: string
  name: string
}): Promise<Response> {
  const res = await fetch(`${BASE_URL}/tenant/create`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(params)
  })
  return res
}

export async function refreshAccessToken(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Refresh token failed: ${res.status}`)
  }
}

export async function logout(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'text/plain',
      Accept: 'application/json'
    }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Logout failed: ${res.status}`)
  }
}
