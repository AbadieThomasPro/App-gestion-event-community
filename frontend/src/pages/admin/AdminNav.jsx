import { NavLink } from 'react-router-dom'

function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Navigation de l’administration">
      <NavLink to="/admin" end>
        Événements
      </NavLink>
      <NavLink to="/admin/users">Utilisateurs & inscriptions</NavLink>
    </nav>
  )
}

export default AdminNav
