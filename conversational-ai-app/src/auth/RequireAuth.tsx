import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const RequireAuth: React.FC = () => {
  const { authorized } = useAuth()
  const location = useLocation()

  if (!authorized) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default RequireAuth
