import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEvents } from '../../api/events'
import { useAuth } from '../../context/useAuth'
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
    <section id="list-event">
      <header className="list-event-header">
        <h1>Événements</h1>
        {canManageEvents && (
          <Link to="/events/new" className="btn btn-primary">
            + Créer un événement
          </Link>
        )}
      </header>

      {isLoading && <p className="list-event-status">Chargement des événements...</p>}
      {error && <p className="list-event-error">{error}</p>}

      {!isLoading && !error && events.length === 0 && (
        <p className="list-event-status">Aucun événement pour le moment.</p>
      )}

      <ul className="event-list">
        {events.map((event) => (
          <li key={event.id} className="event-card">
            <Link to={`/events/${event.id}`}>
              <span className={`status-badge status-${event.status.toLowerCase()}`}>
                {STATUS_LABELS[event.status] ?? event.status}
              </span>
              <h2>{event.title}</h2>
              <p className="event-date">📅 {dateFormatter.format(new Date(event.date))}</p>
              <p className="event-location">📍 {event.location}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ListEventPage
