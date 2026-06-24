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
    <section id="register">
      <h1>Inscription</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Nom</label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

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
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="register-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Inscription...' : "S'inscrire"}
        </button>
      </form>
      <p>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </section>
  )
}

export default RegisterPage
