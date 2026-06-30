import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEvents } from '../../../api/events'
import { useAuth } from '../../../context/useAuth'
import './ListEventPage.css'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  CANCELLED: 'Annulé',
}

function ListEventPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const canManageEvents = user?.role === 'ORGANIZER' || user?.role === 'ADMIN'

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section id="list-event" className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Discord Community Events</p>
          <h1>Événements</h1>
          <p>Découvrez et rejoignez les prochains rendez-vous de la communauté.</p>
        </div>
        {canManageEvents && (
          <Link to="/events/new" className="primary-button">
            + Créer un événement
          </Link>
        )}
      </header>

      {isLoading && <p className="message">Chargement des événements...</p>}
      {error && <p className="message error-message">{error}</p>}

      {!isLoading && !error && events.length === 0 && (
        <p className="empty-state">Aucun événement pour le moment.</p>
      )}

      <ul className="event-list">
        {events.map((event) => (
          <li key={event.id} className="event-card">
            <Link to={`/events/${event.id}`}>
              <div className="event-card-top">
                <span className={`status-badge status-${event.status.toLowerCase()}`}>
                  {STATUS_LABELS[event.status] ?? event.status}
                </span>
                <span className="event-date">📅 {dateFormatter.format(new Date(event.date))}</span>
              </div>
              <h3>{event.title}</h3>
              <p className="event-description">📍 {event.location}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ListEventPage
