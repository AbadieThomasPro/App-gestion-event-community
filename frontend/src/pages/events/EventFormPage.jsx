import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createEvent, getEvent, updateEvent } from '../../api/events'
import { useAuth } from '../../context/useAuth'
import './EventFormPage.css'

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'PUBLISHED', label: 'Publié' },
  { value: 'CANCELLED', label: 'Annulé' },
]

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
  endDate: '',
  location: '',
  capacity: '',
  status: 'DRAFT',
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

function EventFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isEditing) return

    getEvent(id)
      .then((event) =>
        setForm({
          title: event.title,
          description: event.description,
          date: toDateTimeLocal(event.date),
          endDate: toDateTimeLocal(event.endDate),
          location: event.location,
          capacity: event.capacity ?? '',
          status: event.status,
        })
      )
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [id, isEditing])

  function handleChange(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const payload = {
      title: form.title,
      description: form.description,
      date: form.date ? new Date(form.date).toISOString() : '',
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      location: form.location,
      capacity: form.capacity === '' ? null : Number(form.capacity),
      status: form.status,
    }

    try {
      const savedEvent = isEditing
        ? await updateEvent(id, payload, token)
        : await createEvent(payload, token)
      navigate(`/events/${savedEvent.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p>Chargement de l&apos;événement...</p>

  return (
    <section id="event-form">
      <h1>{isEditing ? "Modifier l'événement" : 'Créer un événement'}</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Titre</label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={handleChange('title')}
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={5}
          value={form.description}
          onChange={handleChange('description')}
          required
        />

        <label htmlFor="date">Date de début</label>
        <input
          id="date"
          type="datetime-local"
          value={form.date}
          onChange={handleChange('date')}
          required
        />

        <label htmlFor="endDate">Date de fin (optionnelle)</label>
        <input
          id="endDate"
          type="datetime-local"
          value={form.endDate}
          onChange={handleChange('endDate')}
        />

        <label htmlFor="location">Lieu</label>
        <input
          id="location"
          type="text"
          value={form.location}
          onChange={handleChange('location')}
          required
        />

        <label htmlFor="capacity">Capacité (optionnelle)</label>
        <input
          id="capacity"
          type="number"
          min="1"
          value={form.capacity}
          onChange={handleChange('capacity')}
        />

        <label htmlFor="status">Statut</label>
        <select id="status" value={form.status} onChange={handleChange('status')}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && <p className="event-form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer' : "Créer l'événement"}
        </button>
      </form>
    </section>
  )
}

export default EventFormPage
