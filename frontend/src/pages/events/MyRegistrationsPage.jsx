import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyRegistrations } from '../../api/registrations'
import { useAuth } from '../../context/useAuth'
import './ListEventPage.css'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const REGISTRATION_STATUS_LABELS = {
  CONFIRMED: 'Inscrit·e',
  WAITLISTED: "Sur liste d'attente",
  CANCELLED: 'Annulée',
}

function MyRegistrationsPage() {
  const { token } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMyRegistrations(token)
      .then(setRegistrations)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [token])

  return (
    <section id="list-event">
      <header className="list-event-header">
        <h1>Mes inscriptions</h1>
      </header>

      {isLoading && <p className="list-event-status">Chargement de vos inscriptions...</p>}
      {error && <p className="list-event-error">{error}</p>}

      {!isLoading && !error && registrations.length === 0 && (
        <p className="list-event-status">
          Vous n&apos;êtes inscrit·e à aucun événement pour le moment.
        </p>
      )}

      <ul className="event-list">
        {registrations.map((registration) => (
          <li key={registration.id} className="event-card">
            <Link to={`/events/${registration.event.id}`}>
              <span
                className={`status-badge ${
                  registration.status === 'WAITLISTED' ? 'status-draft' : 'status-published'
                }`}
              >
                {REGISTRATION_STATUS_LABELS[registration.status] ?? registration.status}
              </span>
              <h2>{registration.event.title}</h2>
              <p className="event-date">
                📅 {dateFormatter.format(new Date(registration.event.date))}
              </p>
              <p className="event-location">📍 {registration.event.location}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MyRegistrationsPage
