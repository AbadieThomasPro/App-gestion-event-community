import { useEffect, useState } from 'react'
import { getCurrentUser } from '../api/auth'
import { saveSession, clearSession, getStoredToken, getStoredUser } from '../api/authStorage'
import { AuthContext } from './authContextObject'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken)
  const [user, setUser] = useState(getStoredUser)
  const [isReady, setIsReady] = useState(() => !getStoredToken())

  useEffect(() => {
    const storedToken = getStoredToken()
    if (!storedToken) return

    getCurrentUser(storedToken)
      .then((currentUser) => setUser(currentUser))
      .catch(() => {
        clearSession()
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsReady(true))
  }, [])

  function signIn({ token: newToken, user: newUser }) {
    saveSession({ token: newToken, user: newUser })
    setToken(newToken)
    setUser(newUser)
  }

  function signOut() {
    clearSession()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, isReady, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
