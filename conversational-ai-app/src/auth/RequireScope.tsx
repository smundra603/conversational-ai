import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const RequireScope: React.FC<{
  scopes: string[]
  children: React.ReactNode
}> = ({ scopes, children }) => {
  const { authorized, hasAnyScope } = useAuth()
  const location = useLocation()

  if (!authorized) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasAnyScope(scopes)) {
    // Authorized but missing required scope: send to a safe page
    return <Navigate to="/chat" replace />
  }

  return <>{children}</>
}

export default RequireScope
