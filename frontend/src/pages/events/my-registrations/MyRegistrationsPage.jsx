import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyRegistrations } from '../../../api/registrations'
import { useAuth } from '../../../context/useAuth'
import '../list-event/ListEventPage.css'

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
    <section id="list-event" className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Discord Community Events</p>
          <h1>Mes inscriptions</h1>
          <p>Retrouvez tous les événements auxquels vous êtes inscrit·e.</p>
        </div>
      </header>

      {isLoading && <p className="message">Chargement de vos inscriptions...</p>}
      {error && <p className="message error-message">{error}</p>}

      {!isLoading && !error && registrations.length === 0 && (
        <p className="empty-state">Vous n&apos;êtes inscrit·e à aucun événement pour le moment.</p>
      )}

      <ul className="event-list">
        {registrations.map((registration) => (
          <li key={registration.id} className="event-card">
            <Link to={`/events/${registration.event.id}`}>
              <div className="event-card-top">
                <span
                  className={`status-badge ${
                    registration.status === 'WAITLISTED' ? 'status-draft' : 'status-published'
                  }`}
                >
                  {REGISTRATION_STATUS_LABELS[registration.status] ?? registration.status}
                </span>
                <span className="event-date">
                  📅 {dateFormatter.format(new Date(registration.event.date))}
                </span>
              </div>
              <h3>{registration.event.title}</h3>
              <p className="event-description">📍 {registration.event.location}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MyRegistrationsPage
