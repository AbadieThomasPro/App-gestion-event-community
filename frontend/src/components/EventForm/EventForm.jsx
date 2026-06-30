import { useState } from 'react'
import { EMPTY_EVENT_FORM_VALUES, eventFormValuesToPayload } from './eventFormUtils'

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'PUBLISHED', label: 'Publié' },
  { value: 'CANCELLED', label: 'Annulé' },
]

// Le parent doit passer une `key` (ex. l'id de l'événement édité) pour forcer
// un remount quand `initialValues` change d'identité — voir EventFormPage/AdminPage.
function EventForm({
  initialValues = EMPTY_EVENT_FORM_VALUES,
  onSubmit,
  isSubmitting = false,
  error = '',
  submitLabel,
  onCancel,
}) {
  const [form, setForm] = useState(initialValues)

  function handleChange(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(eventFormValuesToPayload(form))
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <label htmlFor="title" className="full-field">
        Titre
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={handleChange('title')}
          required
        />
      </label>

      <label htmlFor="description" className="full-field">
        Description
        <textarea
          id="description"
          rows={5}
          value={form.description}
          onChange={handleChange('description')}
          required
        />
      </label>

      <label htmlFor="date">
        Date de début
        <input
          id="date"
          type="datetime-local"
          value={form.date}
          onChange={handleChange('date')}
          required
        />
      </label>

      <label htmlFor="endDate">
        Date de fin (optionnelle)
        <input
          id="endDate"
          type="datetime-local"
          value={form.endDate}
          onChange={handleChange('endDate')}
        />
      </label>

      <label htmlFor="location">
        Lieu
        <input
          id="location"
          type="text"
          value={form.location}
          onChange={handleChange('location')}
          required
        />
      </label>

      <label htmlFor="capacity">
        Capacité (optionnelle)
        <input
          id="capacity"
          type="number"
          min="1"
          value={form.capacity}
          onChange={handleChange('capacity')}
        />
      </label>

      <label htmlFor="status">
        Statut
        <select id="status" value={form.status} onChange={handleChange('status')}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="discordChannelId">
        ID du salon Discord (optionnel)
        <input
          id="discordChannelId"
          type="text"
          value={form.discordChannelId}
          onChange={handleChange('discordChannelId')}
        />
      </label>

      <label htmlFor="discordMessageId" className="full-field">
        ID du message Discord (optionnel)
        <input
          id="discordMessageId"
          type="text"
          value={form.discordMessageId}
          onChange={handleChange('discordMessageId')}
        />
      </label>

      {error && <p className="event-form-error">{error}</p>}

      <div className="event-form-actions full-field">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default EventForm
