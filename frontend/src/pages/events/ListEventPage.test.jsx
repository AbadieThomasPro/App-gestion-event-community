import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListEventPage from './ListEventPage'
import { AuthProvider } from '../../context/AuthContext'
import { saveSession } from '../../api/authStorage'
import * as eventsApi from '../../api/events'
import * as authApi from '../../api/auth'

vi.mock('../../api/events')
vi.mock('../../api/auth')

const ORGANIZER = { id: 'user-1', name: 'Jane', email: 'jane@example.com', role: 'ORGANIZER' }
const STANDARD_USER = { id: 'user-2', name: 'Bob', email: 'bob@example.com', role: 'USER' }

const EVENTS = [
  {
    id: 'event-1',
    title: 'Tournoi communautaire',
    description: 'Un tournoi convivial',
    date: '2026-07-15T18:00:00.000Z',
    location: 'Discord',
    capacity: 32,
    status: 'PUBLISHED',
  },
  {
    id: 'event-2',
    title: 'Soirée jeux',
    description: 'Une soirée détente',
    date: '2026-08-01T20:00:00.000Z',
    location: 'Discord',
    capacity: null,
    status: 'DRAFT',
  },
]

function renderListEventPage(user) {
  if (user) {
    saveSession({ token: 'fake-token', user })
    authApi.getCurrentUser.mockResolvedValue(user)
  }

  return render(
    <MemoryRouter>
      <AuthProvider>
        <ListEventPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('ListEventPage', () => {
  it('affiche la liste des événements renvoyés par l’API', async () => {
    eventsApi.getEvents.mockResolvedValue(EVENTS)

    renderListEventPage(STANDARD_USER)

    expect(await screen.findByText('Tournoi communautaire')).toBeInTheDocument()
    expect(screen.getByText('Soirée jeux')).toBeInTheDocument()
  })

  it('affiche un message si aucun événement n’existe', async () => {
    eventsApi.getEvents.mockResolvedValue([])

    renderListEventPage(STANDARD_USER)

    expect(await screen.findByText('Aucun événement pour le moment.')).toBeInTheDocument()
  })

  it('affiche un message d’erreur si le chargement échoue', async () => {
    eventsApi.getEvents.mockRejectedValue(new Error('le chargement a échoué'))

    renderListEventPage(STANDARD_USER)

    expect(await screen.findByText('le chargement a échoué')).toBeInTheDocument()
  })

  it('affiche le bouton de création pour un organisateur', async () => {
    eventsApi.getEvents.mockResolvedValue(EVENTS)

    renderListEventPage(ORGANIZER)

    await waitFor(() => expect(screen.getByText('Tournoi communautaire')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Créer un événement' })).toBeInTheDocument()
  })

  it('ne montre pas le bouton de création pour un utilisateur standard', async () => {
    eventsApi.getEvents.mockResolvedValue(EVENTS)

    renderListEventPage(STANDARD_USER)

    await waitFor(() => expect(screen.getByText('Tournoi communautaire')).toBeInTheDocument())
    expect(screen.queryByRole('link', { name: 'Créer un événement' })).not.toBeInTheDocument()
  })
})
