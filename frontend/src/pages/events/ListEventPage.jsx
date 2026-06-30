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
  const { user, signOut } = useAuth()
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
        <div>
          <h1>Événements</h1>
          {user && <p className="welcome">Connecté en tant que {user.name}</p>}
        </div>
        <div className="list-event-actions">
          {canManageEvents && (
            <Link to="/events/new" className="button">
              Créer un événement
            </Link>
          )}
          <button type="button" className="logout" onClick={signOut}>
            Se déconnecter
          </button>
        </div>
      </header>

      {isLoading && <p>Chargement des événements...</p>}
      {error && <p className="list-event-error">{error}</p>}

      {!isLoading && !error && events.length === 0 && <p>Aucun événement pour le moment.</p>}

      <ul className="event-list">
        {events.map((event) => (
          <li key={event.id} className="event-card">
            <Link to={`/events/${event.id}`}>
              <h2>{event.title}</h2>
              <p className="event-date">{dateFormatter.format(new Date(event.date))}</p>
              <p className="event-location">{event.location}</p>
              <span className={`event-status status-${event.status.toLowerCase()}`}>
                {STATUS_LABELS[event.status] ?? event.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ListEventPage
