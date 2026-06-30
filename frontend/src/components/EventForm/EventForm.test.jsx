import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventForm from './EventForm'
import { eventFormValuesFromEvent } from './eventFormUtils'

const EVENT = {
  id: 'event-1',
  title: 'Tournoi communautaire',
  description: 'Un tournoi convivial',
  date: '2026-07-15T18:00:00.000Z',
  endDate: null,
  location: 'Discord',
  capacity: 32,
  status: 'PUBLISHED',
  discordChannelId: 'channel-123',
  discordMessageId: null,
}

describe('EventForm', () => {
  it('soumet le payload construit à partir des champs remplis', async () => {
    const handleSubmit = vi.fn()
    render(<EventForm onSubmit={handleSubmit} submitLabel="Créer l'événement" />)

    await userEvent.type(screen.getByLabelText('Titre'), 'Nouvel événement')
    await userEvent.type(screen.getByLabelText('Description'), 'Une description')
    await userEvent.type(screen.getByLabelText('Date de début'), '2026-09-01T19:00')
    await userEvent.type(screen.getByLabelText('Lieu'), 'Discord')

    await userEvent.click(screen.getByRole('button', { name: "Créer l'événement" }))

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nouvel événement',
        description: 'Une description',
        location: 'Discord',
        status: 'DRAFT',
      })
    )
  })

  it('préremplit les champs à partir de initialValues', () => {
    render(
      <EventForm
        initialValues={eventFormValuesFromEvent(EVENT)}
        onSubmit={vi.fn()}
        submitLabel="Enregistrer"
      />
    )

    expect(screen.getByDisplayValue('Tournoi communautaire')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Un tournoi convivial')).toBeInTheDocument()
    expect(screen.getByDisplayValue('channel-123')).toBeInTheDocument()
  })

  it('affiche le bouton Annuler seulement si onCancel est fourni', () => {
    const { rerender } = render(<EventForm onSubmit={vi.fn()} submitLabel="Créer" />)
    expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument()

    rerender(<EventForm onSubmit={vi.fn()} submitLabel="Créer" onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
  })

  it('affiche un message d’erreur si fourni', () => {
    render(<EventForm onSubmit={vi.fn()} submitLabel="Créer" error="title est requis" />)

    expect(screen.getByText('title est requis')).toBeInTheDocument()
  })
})
