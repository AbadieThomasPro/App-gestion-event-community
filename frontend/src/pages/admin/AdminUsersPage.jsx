import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createRegistration,
  createUser,
  deleteRegistration,
  deleteUser,
  getRegistrations,
  getUsers,
  updateRegistration,
  updateUser,
} from '../../api/admin'
import { getEvents } from '../../api/events'
import { useAuth } from '../../context/useAuth'
import AdminNav from './AdminNav'
import './AdminPage.css'
import './AdminUsersPage.css'

const EMPTY_USER = {
  name: '',
  email: '',
  password: '',
  role: 'USER',
  discordId: '',
  avatar: '',
  isActive: true,
  emailVerified: false,
}

const EMPTY_REGISTRATION = { userId: '', eventId: '', status: 'CONFIRMED' }

const ROLE_LABELS = {
  USER: 'Utilisateur',
  ORGANIZER: 'Organisateur',
  ADMIN: 'Administrateur',
}

const REGISTRATION_LABELS = {
  CONFIRMED: 'Confirmée',
  WAITLISTED: 'Liste d’attente',
  CANCELLED: 'Annulée',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function AdminUsersPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [userForm, setUserForm] = useState(EMPTY_USER)
  const [registrationForm, setRegistrationForm] = useState(EMPTY_REGISTRATION)
  const [editingUserId, setEditingUserId] = useState(null)
  const [filters, setFilters] = useState({ eventId: '', status: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const handleApiError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        signOut()
        navigate('/login', { replace: true })
      } else {
        setError(err.message)
      }
    },
    [navigate, signOut]
  )

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [usersData, eventsData, registrationsData] = await Promise.all([
        getUsers(),
        getEvents(),
        getRegistrations(filters),
      ])
      setUsers(usersData)
      setEvents(eventsData)
      setRegistrations(registrationsData)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [filters, handleApiError])

  useEffect(() => {
    let isCancelled = false

    Promise.all([getUsers(), getEvents(), getRegistrations(filters)])
      .then(([usersData, eventsData, registrationsData]) => {
        if (isCancelled) return
        setUsers(usersData)
        setEvents(eventsData)
        setRegistrations(registrationsData)
      })
      .catch((err) => {
        if (!isCancelled) handleApiError(err)
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [filters, handleApiError])

  const stats = useMemo(
    () => ({
      users: users.length,
      active: users.filter((user) => user.isActive).length,
      team: users.filter((user) => user.role !== 'USER').length,
      registrations: registrations.length,
    }),
    [registrations, users]
  )

  function changeUserForm(event) {
    const { name, value, type, checked } = event.target
    setUserForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function editUser(user) {
    setEditingUserId(user.id)
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      discordId: user.discordId ?? '',
      avatar: user.avatar ?? '',
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    })
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetUserForm() {
    setEditingUserId(null)
    setUserForm(EMPTY_USER)
  }

  async function submitUser(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        ...userForm,
        discordId: userForm.discordId || null,
        avatar: userForm.avatar || null,
      }
      if (editingUserId) {
        await updateUser(editingUserId, payload)
        setNotice('Utilisateur modifié.')
      } else {
        await createUser(payload)
        setNotice('Utilisateur créé.')
      }
      resetUserForm()
      await loadData()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Supprimer définitivement le compte de ${user.name} ?`)) return
    setError('')
    setNotice('')
    try {
      await deleteUser(user.id)
      setNotice('Utilisateur supprimé.')
      await loadData()
    } catch (err) {
      handleApiError(err)
    }
  }

  async function submitRegistration(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')
    try {
      await createRegistration(registrationForm)
      setRegistrationForm(EMPTY_REGISTRATION)
      setNotice('Inscription ajoutée.')
      await loadData()
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function changeRegistrationStatus(id, status) {
    setError('')
    try {
      await updateRegistration(id, status)
      setNotice('Statut de l’inscription mis à jour.')
      await loadData()
    } catch (err) {
      handleApiError(err)
    }
  }

  function changeFilters(nextFilters) {
    setFilters(nextFilters)
  }

  async function removeRegistration(registration) {
    if (
      !window.confirm(
        `Supprimer l’inscription de ${registration.user.name} à « ${registration.event.title} » ?`
      )
    ) {
      return
    }
    setError('')
    try {
      await deleteRegistration(registration.id)
      setNotice('Inscription supprimée.')
      await loadData()
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <main className="admin-page users-admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Discord Community Events</p>
          <h1>Utilisateurs & inscriptions</h1>
          <p>Gérez les comptes, les permissions et la participation aux événements.</p>
        </div>
      </header>

      <AdminNav />

      <section className="stats-grid user-stats" aria-label="Statistiques des utilisateurs">
        <article>
          <span>Utilisateurs</span>
          <strong>{stats.users}</strong>
        </article>
        <article>
          <span>Comptes actifs</span>
          <strong>{stats.active}</strong>
        </article>
        <article>
          <span>Équipe admin</span>
          <strong>{stats.team}</strong>
        </article>
        <article>
          <span>Inscriptions affichées</span>
          <strong>{stats.registrations}</strong>
        </article>
      </section>

      {(error || notice) && (
        <p className={`message ${error ? 'error-message' : 'success-message'}`}>
          {error || notice}
        </p>
      )}

      <section className="management-section">
        <div className="user-management-grid">
          <article className="management-card user-form-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{editingUserId ? 'Modification' : 'Nouveau compte'}</p>
                <h2>{editingUserId ? 'Modifier l’utilisateur' : 'Créer un utilisateur'}</h2>
              </div>
              {editingUserId && (
                <button className="text-button" type="button" onClick={resetUserForm}>
                  Annuler
                </button>
              )}
            </div>

            <form className="event-form user-form" onSubmit={submitUser}>
              <label>
                Nom
                <input name="name" value={userForm.name} onChange={changeUserForm} required />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={changeUserForm}
                  required
                />
              </label>
              <label>
                Mot de passe
                <input
                  name="password"
                  type="password"
                  minLength="8"
                  value={userForm.password}
                  onChange={changeUserForm}
                  required={!editingUserId}
                  placeholder={editingUserId ? 'Vide pour conserver' : '8 caractères minimum'}
                />
              </label>
              <label>
                Rôle
                <select name="role" value={userForm.role} onChange={changeUserForm}>
                  <option value="USER">Utilisateur</option>
                  <option value="ORGANIZER">Organisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </label>
              <label>
                Identifiant Discord
                <input
                  name="discordId"
                  value={userForm.discordId}
                  onChange={changeUserForm}
                  placeholder="Optionnel"
                />
              </label>
              <label>
                URL de l’avatar
                <input
                  name="avatar"
                  type="url"
                  value={userForm.avatar}
                  onChange={changeUserForm}
                  placeholder="Optionnel"
                />
              </label>
              <label className="checkbox-field">
                <input
                  name="isActive"
                  type="checkbox"
                  checked={userForm.isActive}
                  onChange={changeUserForm}
                />
                Compte actif
              </label>
              <label className="checkbox-field">
                <input
                  name="emailVerified"
                  type="checkbox"
                  checked={userForm.emailVerified}
                  onChange={changeUserForm}
                />
                Email vérifié
              </label>
              <button className="primary-button full-field" type="submit" disabled={isSaving}>
                {isSaving
                  ? 'Enregistrement…'
                  : editingUserId
                    ? 'Enregistrer les modifications'
                    : 'Créer l’utilisateur'}
              </button>
            </form>
          </article>

          <article className="management-card user-list-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Comptes</p>
                <h2>Liste des utilisateurs</h2>
              </div>
              <button className="text-button" type="button" onClick={loadData}>
                Actualiser
              </button>
            </div>

            {isLoading ? (
              <p className="empty-state">Chargement…</p>
            ) : (
              <div className="user-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Rôle</th>
                      <th>État</th>
                      <th>Activité</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                          {user.discordId && <small>Discord : {user.discordId}</small>}
                        </td>
                        <td>
                          <span className={`role-badge role-${user.role.toLowerCase()}`}>
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td>
                          <span className={user.isActive ? 'account-active' : 'account-inactive'}>
                            {user.isActive ? 'Actif' : 'Désactivé'}
                          </span>
                          <small>
                            {user.emailVerified ? 'Email vérifié' : 'Email non vérifié'}
                          </small>
                        </td>
                        <td>
                          <small>{user._count?.events ?? 0} événement(s)</small>
                          <small>{user._count?.registrations ?? 0} inscription(s)</small>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button type="button" onClick={() => editUser(user)}>
                              Modifier
                            </button>
                            <button
                              className="danger-link"
                              type="button"
                              onClick={() => removeUser(user)}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="management-section registrations-section">
        <div className="section-heading registrations-heading">
          <div>
            <p className="eyebrow">Participation</p>
            <h2>Inscriptions aux événements</h2>
          </div>
          <div className="registration-filters">
            <select
              value={filters.eventId}
              onChange={(event) => changeFilters({ ...filters, eventId: event.target.value })}
            >
              <option value="">Tous les événements</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(event) => changeFilters({ ...filters, status: event.target.value })}
            >
              <option value="">Tous les statuts</option>
              <option value="CONFIRMED">Confirmées</option>
              <option value="WAITLISTED">Liste d’attente</option>
              <option value="CANCELLED">Annulées</option>
            </select>
          </div>
        </div>

        <form className="registration-create-form" onSubmit={submitRegistration}>
          <label>
            Utilisateur
            <select
              value={registrationForm.userId}
              onChange={(event) =>
                setRegistrationForm((current) => ({ ...current, userId: event.target.value }))
              }
              required
            >
              <option value="">Choisir un utilisateur</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Événement
            <select
              value={registrationForm.eventId}
              onChange={(event) =>
                setRegistrationForm((current) => ({ ...current, eventId: event.target.value }))
              }
              required
            >
              <option value="">Choisir un événement</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Statut
            <select
              value={registrationForm.status}
              onChange={(event) =>
                setRegistrationForm((current) => ({ ...current, status: event.target.value }))
              }
            >
              {Object.entries(REGISTRATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={isSaving}>
            Ajouter l’inscription
          </button>
        </form>

        <div className="user-table-wrapper">
          <table className="admin-table registrations-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Événement</th>
                <th>Date d’inscription</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr key={registration.id}>
                  <td>
                    <strong>{registration.user.name}</strong>
                    <small>{registration.user.email}</small>
                  </td>
                  <td>
                    <strong>{registration.event.title}</strong>
                    <small>{formatDate(registration.event.date)}</small>
                  </td>
                  <td>{formatDate(registration.createdAt)}</td>
                  <td>
                    <select
                      className={`registration-status status-${registration.status.toLowerCase()}`}
                      value={registration.status}
                      onChange={(event) =>
                        changeRegistrationStatus(registration.id, event.target.value)
                      }
                    >
                      {Object.entries(REGISTRATION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="danger-link"
                      type="button"
                      onClick={() => removeRegistration(registration)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && registrations.length === 0 && (
                <tr>
                  <td className="table-empty" colSpan="5">
                    Aucune inscription pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default AdminUsersPage
