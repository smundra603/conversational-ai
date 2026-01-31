export type JwtPayload = {
  exp?: number
  [key: string]: unknown
}

export function parseJwt(token: string): JwtPayload {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return {}
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    )
    return json
  } catch {
    return {}
  }
}
