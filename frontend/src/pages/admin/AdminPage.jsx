import { useCallback, useEffect, useMemo, useState } from 'react'
import { createEvent, deleteEvent, getEvents, updateEvent } from '../../api/events'
import { useAuth } from '../../context/useAuth'
import EventForm from '../../components/EventForm/EventForm'
import {
  EMPTY_EVENT_FORM_VALUES,
  eventFormValuesFromEvent,
} from '../../components/EventForm/eventFormUtils'
import AdminNav from './AdminNav'
import './AdminPage.css'

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  CANCELLED: 'Annulé',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function AdminPage() {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [initialValues, setInitialValues] = useState(EMPTY_EVENT_FORM_VALUES)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
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
    let isCancelled = false

    getEvents()
      .then((data) => {
        if (!isCancelled) setEvents(data)
      })
      .catch((err) => {
        if (!isCancelled) setError(err.message)
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const stats = useMemo(
    () => ({
      total: events.length,
      published: events.filter((event) => event.status === 'PUBLISHED').length,
      draft: events.filter((event) => event.status === 'DRAFT').length,
    }),
    [events]
  )

  function startEditing(event) {
    setEditingId(event.id)
    setInitialValues(eventFormValuesFromEvent(event))
    setNotice('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setInitialValues(EMPTY_EVENT_FORM_VALUES)
  }

  async function handleSubmit(payload) {
    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      if (editingId) {
        await updateEvent(editingId, payload, token)
        setNotice('Événement modifié avec succès.')
      } else {
        await createEvent(payload, token)
        setNotice('Événement créé avec succès.')
      }
      resetForm()
      await loadEvents()
    } catch (err) {
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
      await deleteEvent(event.id, token)
      setNotice('Événement supprimé.')
      if (editingId === event.id) resetForm()
      await loadEvents()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Discord Community Events</p>
          <h1>Gestion des événements</h1>
          <p>Créez, publiez et mettez à jour les rendez-vous de la communauté.</p>
        </div>
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

      {notice && <p className="message success-message">{notice}</p>}

      <div className="admin-layout">
        <section className="event-form-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{editingId ? 'Modification' : 'Nouvel événement'}</p>
              <h2>{editingId ? 'Modifier l’événement' : 'Créer un événement'}</h2>
            </div>
          </div>

          <EventForm
            key={editingId ?? 'new'}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            isSubmitting={isSaving}
            error={error}
            submitLabel={editingId ? 'Enregistrer les modifications' : 'Créer l’événement'}
            onCancel={editingId ? resetForm : undefined}
          />
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
