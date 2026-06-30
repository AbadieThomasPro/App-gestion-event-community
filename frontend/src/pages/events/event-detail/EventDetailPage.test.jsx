import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EventDetailPage from './EventDetailPage'
import { AuthProvider } from '../../../context/AuthContext'
import { saveSession } from '../../../api/authStorage'
import * as eventsApi from '../../../api/events'
import * as registrationsApi from '../../../api/registrations'
import * as authApi from '../../../api/auth'

vi.mock('../../../api/events')
vi.mock('../../../api/registrations')
vi.mock('../../../api/auth')

const ADMIN = { id: 'user-1', name: 'Admin', email: 'admin@example.com', role: 'ADMIN' }
const STANDARD_USER = { id: 'user-2', name: 'Bob', email: 'bob@example.com', role: 'USER' }

const EVENT = {
  id: 'event-1',
  title: 'Tournoi communautaire',
  description: 'Un tournoi convivial organisé avec la communauté',
  date: '2026-07-15T18:00:00.000Z',
  endDate: null,
  location: 'Discord',
  capacity: 32,
  status: 'PUBLISHED',
}

function renderEventDetailPage(user, { route = '/events/event-1' } = {}) {
  if (user) {
    saveSession({ token: 'fake-token', user })
    authApi.getCurrentUser.mockResolvedValue(user)
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/" element={<p>Page liste des événements</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  registrationsApi.getMyRegistrationForEvent.mockResolvedValue(null)
})

describe('EventDetailPage', () => {
  it('affiche les détails de l’événement', async () => {
    eventsApi.getEvent.mockResolvedValue(EVENT)

    renderEventDetailPage(STANDARD_USER)

    expect(await screen.findByText('Tournoi communautaire')).toBeInTheDocument()
    expect(screen.getByText(EVENT.description)).toBeInTheDocument()
    expect(screen.getByText('Discord')).toBeInTheDocument()
    expect(eventsApi.getEvent).toHaveBeenCalledWith('event-1')
  })

  it('affiche un message d’erreur si l’événement est introuvable', async () => {
    eventsApi.getEvent.mockRejectedValue(new Error('événement introuvable'))

    renderEventDetailPage(STANDARD_USER)

    expect(await screen.findByText('événement introuvable')).toBeInTheDocument()
  })

  it('affiche les actions modifier/supprimer pour un admin', async () => {
    eventsApi.getEvent.mockResolvedValue(EVENT)

    renderEventDetailPage(ADMIN)

    expect(await screen.findByRole('link', { name: 'Modifier' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
  })

  it('ne montre pas les actions modifier/supprimer pour un utilisateur standard', async () => {
    eventsApi.getEvent.mockResolvedValue(EVENT)

    renderEventDetailPage(STANDARD_USER)

    await waitFor(() => expect(screen.getByText('Tournoi communautaire')).toBeInTheDocument())
    expect(screen.queryByRole('link', { name: 'Modifier' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument()
  })

  describe('suppression', () => {
    beforeEach(() => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
    })

    afterEach(() => {
      window.confirm.mockRestore()
    })

    it('supprime l’événement et revient à la liste', async () => {
      eventsApi.getEvent.mockResolvedValue(EVENT)
      eventsApi.deleteEvent.mockResolvedValue(null)

      renderEventDetailPage(ADMIN)

      await userEvent.click(await screen.findByRole('button', { name: 'Supprimer' }))

      await waitFor(() =>
        expect(eventsApi.deleteEvent).toHaveBeenCalledWith('event-1', 'fake-token')
      )
      expect(await screen.findByText('Page liste des événements')).toBeInTheDocument()
    })
  })

  describe('inscription', () => {
    it("propose de s'inscrire quand l'utilisateur n'est pas inscrit", async () => {
      eventsApi.getEvent.mockResolvedValue(EVENT)
      registrationsApi.getMyRegistrationForEvent.mockResolvedValue(null)
      registrationsApi.registerForEvent.mockResolvedValue({
        id: 'registration-1',
        status: 'CONFIRMED',
      })

      renderEventDetailPage(STANDARD_USER)

      const registerButton = await screen.findByRole('button', { name: "S'inscrire" })
      await userEvent.click(registerButton)

      await waitFor(() =>
        expect(registrationsApi.registerForEvent).toHaveBeenCalledWith('event-1', 'fake-token')
      )
      expect(await screen.findByRole('button', { name: 'Se désinscrire' })).toBeInTheDocument()
      expect(screen.getByText('Inscrit·e')).toBeInTheDocument()
    })

    it('propose de se désinscrire quand l’utilisateur est déjà inscrit', async () => {
      eventsApi.getEvent.mockResolvedValue(EVENT)
      registrationsApi.getMyRegistrationForEvent.mockResolvedValue({
        id: 'registration-1',
        status: 'CONFIRMED',
      })
      registrationsApi.unregisterFromEvent.mockResolvedValue(null)

      renderEventDetailPage(STANDARD_USER)

      const unregisterButton = await screen.findByRole('button', { name: 'Se désinscrire' })
      await userEvent.click(unregisterButton)

      await waitFor(() =>
        expect(registrationsApi.unregisterFromEvent).toHaveBeenCalledWith('event-1', 'fake-token')
      )
      expect(await screen.findByRole('button', { name: "S'inscrire" })).toBeInTheDocument()
    })

    it("affiche le statut liste d'attente", async () => {
      eventsApi.getEvent.mockResolvedValue(EVENT)
      registrationsApi.getMyRegistrationForEvent.mockResolvedValue({
        id: 'registration-1',
        status: 'WAITLISTED',
      })

      renderEventDetailPage(STANDARD_USER)

      expect(await screen.findByText("Sur liste d'attente")).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Se désinscrire' })).toBeInTheDocument()
    })
  })
})
