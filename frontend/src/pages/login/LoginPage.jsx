import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuth } from '../../context/useAuth'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { token, user } = await login({ email, password })
      signIn({ token, user })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="login">
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p>
        Pas encore de compte ? <Link to="/register">S&apos;inscrire</Link>
      </p>
    </section>
  )
}

export default LoginPage
