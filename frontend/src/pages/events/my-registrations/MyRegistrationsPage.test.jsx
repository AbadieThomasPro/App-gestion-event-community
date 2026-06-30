import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MyRegistrationsPage from './MyRegistrationsPage'
import { AuthProvider } from '../../../context/AuthContext'
import { saveSession } from '../../../api/authStorage'
import * as registrationsApi from '../../../api/registrations'
import * as authApi from '../../../api/auth'

vi.mock('../../../api/registrations')
vi.mock('../../../api/auth')

const USER = { id: 'user-1', name: 'Bob', email: 'bob@example.com', role: 'USER' }

const REGISTRATIONS = [
  {
    id: 'registration-1',
    status: 'CONFIRMED',
    event: {
      id: 'event-1',
      title: 'Tournoi communautaire',
      date: '2026-07-15T18:00:00.000Z',
      location: 'Discord',
    },
  },
  {
    id: 'registration-2',
    status: 'WAITLISTED',
    event: {
      id: 'event-2',
      title: 'Soirée jeux',
      date: '2026-08-01T20:00:00.000Z',
      location: 'Discord',
    },
  },
]

function renderMyRegistrationsPage() {
  saveSession({ token: 'fake-token', user: USER })
  authApi.getCurrentUser.mockResolvedValue(USER)

  return render(
    <MemoryRouter>
      <AuthProvider>
        <MyRegistrationsPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('MyRegistrationsPage', () => {
  it("affiche les événements auxquels l'utilisateur est inscrit", async () => {
    registrationsApi.getMyRegistrations.mockResolvedValue(REGISTRATIONS)

    renderMyRegistrationsPage()

    expect(await screen.findByText('Tournoi communautaire')).toBeInTheDocument()
    expect(screen.getByText('Soirée jeux')).toBeInTheDocument()
    expect(screen.getByText("Sur liste d'attente")).toBeInTheDocument()
  })

  it('affiche un message si aucune inscription', async () => {
    registrationsApi.getMyRegistrations.mockResolvedValue([])

    renderMyRegistrationsPage()

    expect(
      await screen.findByText("Vous n'êtes inscrit·e à aucun événement pour le moment.")
    ).toBeInTheDocument()
  })

  it('affiche un message d’erreur si le chargement échoue', async () => {
    registrationsApi.getMyRegistrations.mockRejectedValue(new Error('le chargement a échoué'))

    renderMyRegistrationsPage()

    expect(await screen.findByText('le chargement a échoué')).toBeInTheDocument()
  })
})
