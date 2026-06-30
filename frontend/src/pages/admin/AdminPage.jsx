import { useCallback, useEffect, useMemo, useState } from 'react'
import { loginAdmin } from '../../api/auth'
import { clearSession, getStoredUser, getToken, saveSession } from '../../api/authStorage'
import { createEvent, deleteEvent, getEvents, updateEvent } from '../../api/events'
import AdminNav from './AdminNav'
import './AdminPage.css'

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
  endDate: '',
  location: '',
  capacity: '',
  status: 'DRAFT',
  discordChannelId: '',
  discordMessageId: '',
}

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  CANCELLED: 'Annulé',
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function AdminPage() {
  const storedUser = getStoredUser()
  const hasAdminSession = Boolean(getToken() && storedUser?.role === 'ADMIN')
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminSession)
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'admin' })
  const [events, setEvents] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(hasAdminSession)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      setEvents(await getEvents())
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    let isCurrent = true
    getEvents()
      .then((data) => {
        if (isCurrent) setEvents(data)
      })
      .catch((err) => {
        if (isCurrent) setError(err.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [isAuthenticated])

  const stats = useMemo(
    () => ({
      total: events.length,
      published: events.filter((event) => event.status === 'PUBLISHED').length,
      draft: events.filter((event) => event.status === 'DRAFT').length,
    }),
    [events]
  )

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const session = await loginAdmin(credentials)
      saveSession(session)
      setIsAuthenticated(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleLogout() {
    clearSession()
    setIsAuthenticated(false)
    setEvents([])
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function startEditing(event) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      description: event.description,
      date: toDateTimeLocal(event.date),
      endDate: toDateTimeLocal(event.endDate),
      location: event.location,
      capacity: event.capacity ?? '',
      status: event.status,
      discordChannelId: event.discordChannelId ?? '',
      discordMessageId: event.discordMessageId ?? '',
    })
    setNotice('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')

    const payload = {
      ...form,
      date: new Date(form.date).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      capacity: form.capacity ? Number(form.capacity) : null,
      discordChannelId: form.discordChannelId || null,
      discordMessageId: form.discordMessageId || null,
    }

    try {
      if (editingId) {
        await updateEvent(editingId, payload)
        setNotice('Événement modifié avec succès.')
      } else {
        await createEvent(payload)
        setNotice('Événement créé avec succès.')
      }
      resetForm()
      await loadEvents()
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearSession()
        setIsAuthenticated(false)
      }
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(event) {
    if (!window.confirm(`Supprimer définitivement « ${event.title} » ?`)) return

    setError('')
    setNotice('')

    try {
      await deleteEvent(event.id)
      setNotice('Événement supprimé.')
      if (editingId === event.id) resetForm()
      await loadEvents()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="admin-login">
        <div className="admin-login-card">
          <div className="admin-mark">EC</div>
          <p className="eyebrow">Espace sécurisé</p>
          <h1>Administration</h1>
          <p className="login-intro">
            Connectez-vous pour créer et gérer les événements de la communauté.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="admin-username">Identifiant</label>
            <input
              id="admin-username"
              value={credentials.username}
              onChange={(event) =>
                setCredentials((current) => ({ ...current, username: event.target.value }))
              }
              autoComplete="username"
              required
            />

            <label htmlFor="admin-password">Mot de passe</label>
            <input
              id="admin-password"
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((current) => ({ ...current, password: event.target.value }))
              }
              autoComplete="current-password"
              required
            />

            {error && <p className="message error-message">{error}</p>}

            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Connexion…' : 'Accéder à la gestion'}
            </button>
          </form>
          <p className="temporary-access">Accès temporaire : admin / admin</p>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Discord Community Events</p>
          <h1>Gestion des événements</h1>
          <p>Créez, publiez et mettez à jour les rendez-vous de la communauté.</p>
        </div>
        <button className="ghost-button" type="button" onClick={handleLogout}>
          Déconnexion
        </button>
      </header>

      <AdminNav />

      <section className="stats-grid" aria-label="Statistiques des événements">
        <article>
          <span>Total</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Publiés</span>
          <strong>{stats.published}</strong>
        </article>
        <article>
          <span>Brouillons</span>
          <strong>{stats.draft}</strong>
        </article>
      </section>

      {(error || notice) && (
        <p className={`message ${error ? 'error-message' : 'success-message'}`}>
          {error || notice}
        </p>
      )}

      <div className="admin-layout">
        <section className="event-form-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{editingId ? 'Modification' : 'Nouvel événement'}</p>
              <h2>{editingId ? 'Modifier l’événement' : 'Créer un événement'}</h2>
            </div>
            {editingId && (
              <button className="text-button" type="button" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>

          <form className="event-form" onSubmit={handleSubmit}>
            <label className="full-field">
              Titre
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>

            <label className="full-field">
              Description
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Date de début
              <input
                name="date"
                type="datetime-local"
                value={form.date}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Date de fin
              <input
                name="endDate"
                type="datetime-local"
                value={form.endDate}
                onChange={handleChange}
              />
            </label>

            <label>
              Lieu
              <input name="location" value={form.location} onChange={handleChange} required />
            </label>

            <label>
              Capacité
              <input
                name="capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={handleChange}
                placeholder="Illimitée"
              />
            </label>

            <label>
              Statut
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </label>

            <label>
              ID du salon Discord
              <input
                name="discordChannelId"
                value={form.discordChannelId}
                onChange={handleChange}
                placeholder="Optionnel"
              />
            </label>

            <label className="full-field">
              ID du message Discord
              <input
                name="discordMessageId"
                value={form.discordMessageId}
                onChange={handleChange}
                placeholder="Optionnel"
              />
            </label>

            <button className="primary-button full-field" type="submit" disabled={isSaving}>
              {isSaving
                ? 'Enregistrement…'
                : editingId
                  ? 'Enregistrer les modifications'
                  : 'Créer l’événement'}
            </button>
          </form>
        </section>

        <section className="event-list-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Calendrier</p>
              <h2>Événements existants</h2>
            </div>
            <button className="text-button" type="button" onClick={loadEvents}>
              Actualiser
            </button>
          </div>

          {isLoading ? (
            <p className="empty-state">Chargement des événements…</p>
          ) : events.length === 0 ? (
            <p className="empty-state">Aucun événement pour le moment.</p>
          ) : (
            <div className="event-list">
              {events.map((event) => (
                <article className="event-card" key={event.id}>
                  <div className="event-card-top">
                    <span className={`status-badge status-${event.status.toLowerCase()}`}>
                      {STATUS_LABELS[event.status]}
                    </span>
                    <span className="event-date">{formatDate(event.date)}</span>
                  </div>
                  <h3>{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                  <dl>
                    <div>
                      <dt>Lieu</dt>
                      <dd>{event.location}</dd>
                    </div>
                    <div>
                      <dt>Capacité</dt>
                      <dd>{event.capacity ?? 'Illimitée'}</dd>
                    </div>
                    {event.endDate && (
                      <div>
                        <dt>Fin</dt>
                        <dd>{formatDate(event.endDate)}</dd>
                      </div>
                    )}
                    {event.discordChannelId && (
                      <div>
                        <dt>Salon Discord</dt>
                        <dd>{event.discordChannelId}</dd>
                      </div>
                    )}
                    {event.discordMessageId && (
                      <div>
                        <dt>Message Discord</dt>
                        <dd>{event.discordMessageId}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="event-actions">
                    <button type="button" onClick={() => startEditing(event)}>
                      Modifier
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => handleDelete(event)}
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default AdminPage
