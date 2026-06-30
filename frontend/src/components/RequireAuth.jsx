import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Header from './Header'

function RequireAuth({ children }) {
  const { token, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) return null

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <>
      <Header />
      {children}
    </>
  )
}

export default RequireAuth
