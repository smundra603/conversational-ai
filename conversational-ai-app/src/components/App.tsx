import RequireAuth from 'auth/RequireAuth'
import RequireScope from 'auth/RequireScope'
import { Route, Routes } from 'react-router-dom'
import Agent from './Agent'
import Chat from './Chat'
import Login from './Login'
import NavBar from './NavBar'
import Usage from './Usage'
import Users from './Users'

const App = () => {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Chat />} />
          <Route path="/chat" element={<Chat />} />
          <Route
            path="/usage"
            element={
              <RequireScope scopes={['usage:dashboard']}>
                <Usage />
              </RequireScope>
            }
          />
          <Route path="/agent" element={<Agent />} />
          <Route
            path="/users"
            element={
              <RequireScope scopes={['user:dashboard']}>
                <Users />
              </RequireScope>
            }
          />
        </Route>
      </Routes>
    </>
  )
}
export default App
