import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createEvent, getEvent, updateEvent } from '../../../api/events'
import { useAuth } from '../../../context/useAuth'
import EventForm from '../../../components/EventForm/EventForm'
import {
  EMPTY_EVENT_FORM_VALUES,
  eventFormValuesFromEvent,
} from '../../../components/EventForm/eventFormUtils'
import './EventFormPage.css'

function EventFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const isEditing = Boolean(id)

  const [initialValues, setInitialValues] = useState(EMPTY_EVENT_FORM_VALUES)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isEditing) return

    getEvent(id)
      .then((event) => setInitialValues(eventFormValuesFromEvent(event)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [id, isEditing])

  async function handleSubmit(payload) {
    setError('')
    setIsSubmitting(true)

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
      <EventForm
        key={id ?? 'new'}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        submitLabel={isEditing ? 'Enregistrer' : "Créer l'événement"}
      />
    </section>
  )
}

export default EventFormPage
