import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteEvent, getEvent } from '../../../api/events'
import {
  getMyRegistrationForEvent,
  registerForEvent,
  unregisterFromEvent,
} from '../../../api/registrations'
import { useAuth } from '../../../context/useAuth'
import './EventDetailPage.css'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  CANCELLED: 'Annulé',
}

const REGISTRATION_STATUS_LABELS = {
  CONFIRMED: 'Inscrit·e',
  WAITLISTED: "Sur liste d'attente",
}

function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [myRegistration, setMyRegistration] = useState(null)
  const [registrationError, setRegistrationError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const canManageEvents = user?.role === 'ORGANIZER' || user?.role === 'ADMIN'

  useEffect(() => {
    let isCancelled = false

    getEvent(id)
      .then((result) => {
        if (!isCancelled) setEvent(result)
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
  }, [id])

  useEffect(() => {
    if (!token) return
    let isCancelled = false

    getMyRegistrationForEvent(id, token).then((result) => {
      if (!isCancelled) setMyRegistration(result)
    })

    return () => {
      isCancelled = true
    }
  }, [id, token])

  async function handleDelete() {
    if (!window.confirm('Supprimer cet événement ?')) return

    setIsDeleting(true)
    try {
      await deleteEvent(id, token)
      navigate('/')
    } catch (err) {
      setError(err.message)
      setIsDeleting(false)
    }
  }

  async function handleRegister() {
    setRegistrationError('')
    setIsRegistering(true)
    try {
      const registration = await registerForEvent(id, token)
      setMyRegistration(registration)
    } catch (err) {
      setRegistrationError(err.message)
    } finally {
      setIsRegistering(false)
    }
  }

  async function handleUnregister() {
    setRegistrationError('')
    setIsRegistering(true)
    try {
      await unregisterFromEvent(id, token)
      setMyRegistration(null)
    } catch (err) {
      setRegistrationError(err.message)
    } finally {
      setIsRegistering(false)
    }
  }

  if (isLoading) return <p>Chargement de l&apos;événement...</p>
  if (error) return <p className="message error-message">{error}</p>
  if (!event) return null

  return (
    <section id="event-detail">
      <Link to="/" className="back-link">
        ← Retour aux événements
      </Link>

      <div className="card">
        <header className="event-detail-header">
          <div>
            <p className="eyebrow">Discord Community Events</p>
            <h1>{event.title}</h1>
          </div>
          <span className={`status-badge status-${event.status.toLowerCase()}`}>
            {STATUS_LABELS[event.status] ?? event.status}
          </span>
        </header>

        <dl className="event-detail-info">
          <div>
            <dt>Date</dt>
            <dd>{dateFormatter.format(new Date(event.date))}</dd>
          </div>
          {event.endDate && (
            <div>
              <dt>Date de fin</dt>
              <dd>{dateFormatter.format(new Date(event.endDate))}</dd>
            </div>
          )}
          <div>
            <dt>Lieu</dt>
            <dd>{event.location}</dd>
          </div>
          {event.capacity && (
            <div>
              <dt>Capacité</dt>
              <dd>{event.capacity} places</dd>
            </div>
          )}
        </dl>

        <p className="event-detail-description">{event.description}</p>

        <div className="event-detail-registration">
          {myRegistration ? (
            <>
              <span className="status-badge status-published">
                {REGISTRATION_STATUS_LABELS[myRegistration.status] ?? myRegistration.status}
              </span>
              <button
                type="button"
                className="danger-button"
                onClick={handleUnregister}
                disabled={isRegistering}
              >
                {isRegistering ? 'Désinscription...' : 'Se désinscrire'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? 'Inscription...' : "S'inscrire"}
            </button>
          )}
          {registrationError && <p className="message error-message">{registrationError}</p>}
        </div>

        {canManageEvents && (
          <div className="event-detail-actions">
            <Link to={`/events/${event.id}/edit`} className="ghost-button">
              Modifier
            </Link>
            <button
              type="button"
              className="danger-button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default EventDetailPage
