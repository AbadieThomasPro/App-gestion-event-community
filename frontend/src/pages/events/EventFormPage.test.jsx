import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EventFormPage from './EventFormPage'
import { AuthProvider } from '../../context/AuthContext'
import * as eventsApi from '../../api/events'

vi.mock('../../api/events')

const EVENT = {
  id: 'event-1',
  title: 'Tournoi communautaire',
  description: 'Un tournoi convivial',
  date: '2026-07-15T18:00:00.000Z',
  endDate: null,
  location: 'Discord',
  capacity: 32,
  status: 'PUBLISHED',
}

function renderEventFormPage(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path="/events/new" element={<EventFormPage />} />
          <Route path="/events/:id/edit" element={<EventFormPage />} />
          <Route path="/events/:id" element={<p>Détail de l’événement</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('EventFormPage - création', () => {
  it('crée un événement et redirige vers sa page de détail', async () => {
    eventsApi.createEvent.mockResolvedValue({ ...EVENT, id: 'new-event-id' })

    renderEventFormPage('/events/new')

    await userEvent.type(screen.getByLabelText('Titre'), 'Nouvel événement')
    await userEvent.type(screen.getByLabelText('Description'), 'Une description')
    fireEvent.change(screen.getByLabelText('Date de début'), {
      target: { value: '2026-09-01T19:00' },
    })
    await userEvent.type(screen.getByLabelText('Lieu'), 'Discord')

    await userEvent.click(screen.getByRole('button', { name: "Créer l'événement" }))

    await waitFor(() => expect(eventsApi.createEvent).toHaveBeenCalled())
    const [payload] = eventsApi.createEvent.mock.calls[0]
    expect(payload).toMatchObject({
      title: 'Nouvel événement',
      description: 'Une description',
      location: 'Discord',
      status: 'DRAFT',
    })

    expect(await screen.findByText('Détail de l’événement')).toBeInTheDocument()
  })

  it('affiche un message d’erreur si la création échoue', async () => {
    eventsApi.createEvent.mockRejectedValue(new Error('title est requis'))

    renderEventFormPage('/events/new')

    await userEvent.type(screen.getByLabelText('Titre'), 'Nouvel événement')
    await userEvent.type(screen.getByLabelText('Description'), 'Une description')
    fireEvent.change(screen.getByLabelText('Date de début'), {
      target: { value: '2026-09-01T19:00' },
    })
    await userEvent.type(screen.getByLabelText('Lieu'), 'Discord')

    await userEvent.click(screen.getByRole('button', { name: "Créer l'événement" }))

    expect(await screen.findByText('title est requis')).toBeInTheDocument()
  })
})

describe('EventFormPage - édition', () => {
  it('précharge le formulaire puis modifie l’événement', async () => {
    eventsApi.getEvent.mockResolvedValue(EVENT)
    eventsApi.updateEvent.mockResolvedValue(EVENT)

    renderEventFormPage('/events/event-1/edit')

    expect(await screen.findByDisplayValue('Tournoi communautaire')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Un tournoi convivial')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Discord')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Titre'))
    await userEvent.type(screen.getByLabelText('Titre'), 'Titre modifié')

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() =>
      expect(eventsApi.updateEvent).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({ title: 'Titre modifié' }),
        null
      )
    )

    expect(await screen.findByText('Détail de l’événement')).toBeInTheDocument()
  })
})
