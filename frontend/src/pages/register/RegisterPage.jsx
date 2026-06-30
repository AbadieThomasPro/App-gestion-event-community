import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register, login } from '../../api/auth'
import { useAuth } from '../../context/useAuth'
import './RegisterPage.css'

function RegisterPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await register({ name, email, password })
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
    <section id="register" className="auth-page">
      <div className="auth-card">
        <div className="auth-mark">EC</div>
        <p className="eyebrow">Bienvenue</p>
        <h1>Inscription</h1>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">
            Nom
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label htmlFor="password">
            Mot de passe
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <p className="message error-message">{error}</p>}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>

        <p className="auth-card-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </section>
  )
}

export default RegisterPage
