import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Header from './Header/Header'

function RequireAuth({ children, roles }) {
  const { token, user, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) return null

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <Header />
      {children}
    </>
  )
}

export default RequireAuth
