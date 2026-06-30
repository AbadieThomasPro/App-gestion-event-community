import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './Header.css'

const ROLE_LABELS = {
  USER: 'Membre',
  ORGANIZER: 'Organisateur',
  ADMIN: 'Admin',
}

function navLinkClassName({ isActive }) {
  return isActive ? 'active' : undefined
}

function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="app-header">
      <span className="app-header-brand">
        <span aria-hidden="true">🗓️</span> Événements Communautaires
      </span>

      <nav className="app-header-nav">
        <NavLink to="/" end className={navLinkClassName}>
          Événements
        </NavLink>
        <NavLink to="/my-events" className={navLinkClassName}>
          Mes inscriptions
        </NavLink>
      </nav>

      {user && (
        <div className="app-header-user">
          <span className="app-header-username">{user.name}</span>
          <span className={`role-badge role-${user.role.toLowerCase()}`}>
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
          <button type="button" className="btn btn-ghost" onClick={signOut}>
            Se déconnecter
          </button>
        </div>
      )}
    </header>
  )
}

export default Header
