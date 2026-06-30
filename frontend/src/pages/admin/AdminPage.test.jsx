import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminPage from './AdminPage'
import { AuthProvider } from '../../context/AuthContext'
import { saveSession } from '../../api/authStorage'
import * as eventsApi from '../../api/events'
import * as authApi from '../../api/auth'

vi.mock('../../api/events')
vi.mock('../../api/auth')

const ADMIN = { id: 'admin-1', name: 'Alice', email: 'alice@example.com', role: 'ADMIN' }

const EVENT = {
  id: 'event-1',
  title: 'Tournoi communautaire',
  description: 'Un tournoi convivial',
  date: '2026-07-15T18:00:00.000Z',
  endDate: null,
  location: 'Discord',
  capacity: 32,
  status: 'PUBLISHED',
  discordChannelId: null,
  discordMessageId: null,
}

function renderAdminPage() {
  saveSession({ token: 'fake-token', user: ADMIN })
  authApi.getCurrentUser.mockResolvedValue(ADMIN)

  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('AdminPage', () => {
  it('affiche la liste des événements existants', async () => {
    eventsApi.getEvents.mockResolvedValue([EVENT])

    renderAdminPage()

    expect(await screen.findByText('Tournoi communautaire')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('affiche un message si aucun événement', async () => {
    eventsApi.getEvents.mockResolvedValue([])

    renderAdminPage()

    expect(await screen.findByText('Aucun événement pour le moment.')).toBeInTheDocument()
  })

  it('crée un événement avec le token courant', async () => {
    eventsApi.getEvents.mockResolvedValue([])
    eventsApi.createEvent.mockResolvedValue({ ...EVENT, id: 'event-2' })

    renderAdminPage()

    await screen.findByText('Aucun événement pour le moment.')

    await userEvent.type(screen.getByLabelText('Titre'), 'Nouvel événement')
    await userEvent.type(screen.getByLabelText('Description'), 'Une description')
    await userEvent.type(screen.getByLabelText('Date de début'), '2026-09-01T19:00')
    await userEvent.type(screen.getByLabelText('Lieu'), 'Discord')

    await userEvent.click(screen.getByRole('button', { name: 'Créer l’événement' }))

    await waitFor(() => expect(eventsApi.createEvent).toHaveBeenCalled())
    const [payload, token] = eventsApi.createEvent.mock.calls[0]
    expect(payload).toMatchObject({ title: 'Nouvel événement', location: 'Discord' })
    expect(token).toBe('fake-token')
  })

  it('précharge le formulaire et modifie un événement existant', async () => {
    eventsApi.getEvents.mockResolvedValue([EVENT])
    eventsApi.updateEvent.mockResolvedValue(EVENT)

    renderAdminPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Modifier' }))

    expect(await screen.findByDisplayValue('Tournoi communautaire')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))

    await waitFor(() =>
      expect(eventsApi.updateEvent).toHaveBeenCalledWith(
        'event-1',
        expect.any(Object),
        'fake-token'
      )
    )
  })

  describe('suppression', () => {
    beforeEach(() => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
    })

    afterEach(() => {
      window.confirm.mockRestore()
    })

    it('supprime un événement avec le token courant', async () => {
      eventsApi.getEvents.mockResolvedValue([EVENT])
      eventsApi.deleteEvent.mockResolvedValue(null)

      renderAdminPage()

      await userEvent.click(await screen.findByRole('button', { name: 'Supprimer' }))

      await waitFor(() =>
        expect(eventsApi.deleteEvent).toHaveBeenCalledWith('event-1', 'fake-token')
      )
    })
  })
})
