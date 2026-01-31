// component/NavBar

import { useAuth } from 'auth/AuthProvider'
import { NavLink, useNavigate } from 'react-router-dom'
import './index.css'

const NavBar = () => {
  const { authorized, signOut, hasScope } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  if (!authorized) {
    return null
  }
  return (
    <nav className="mt-[10px] border-b border-gray-200 pb-2">
      <div className="mx-5">
        <ul style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <li>
            <NavLink
              to="/chat"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Chat
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/agent"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Agents
            </NavLink>
          </li>
          {hasScope('usage:dashboard') && (
            <li>
              <NavLink
                to="/usage"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                Usage
              </NavLink>
            </li>
          )}
          {hasScope('user:dashboard') && (
            <li>
              <NavLink
                to="/users"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                Users
              </NavLink>
            </li>
          )}
          {/* Create Tenant moved to Login page */}
          <li style={{ marginLeft: 'auto' }}>
            {authorized ? (
              <button onClick={onLogout} style={{ cursor: 'pointer' }}>
                Logout
              </button>
            ) : (
              <NavLink to="/login">Login</NavLink>
            )}
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default NavBar
