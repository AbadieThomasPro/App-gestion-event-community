import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminUsersPage from './AdminUsersPage'
import { AuthProvider } from '../../context/AuthContext'
import { saveSession } from '../../api/authStorage'
import * as adminApi from '../../api/admin'
import * as eventsApi from '../../api/events'
import * as authApi from '../../api/auth'

vi.mock('../../api/admin')
vi.mock('../../api/events')
vi.mock('../../api/auth')

const ADMIN = { id: 'admin-1', name: 'Alice', email: 'alice@example.com', role: 'ADMIN' }

const USER_ROW = {
  id: 'user-1',
  name: 'Bob',
  email: 'bob@example.com',
  role: 'USER',
  discordId: null,
  avatar: null,
  isActive: true,
  emailVerified: false,
  _count: { events: 0, registrations: 2 },
}

const EVENT = {
  id: 'event-1',
  title: 'Tournoi communautaire',
  date: '2026-07-15T18:00:00.000Z',
  status: 'PUBLISHED',
}

const REGISTRATION = {
  id: 'registration-1',
  status: 'CONFIRMED',
  createdAt: '2026-06-25T10:00:00.000Z',
  user: { name: 'Bob', email: 'bob@example.com' },
  event: { id: 'event-1', title: 'Tournoi communautaire', date: '2026-07-15T18:00:00.000Z' },
}

function renderAdminUsersPage() {
  saveSession({ token: 'fake-token', user: ADMIN })
  authApi.getCurrentUser.mockResolvedValue(ADMIN)
  eventsApi.getEvents.mockResolvedValue([EVENT])

  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminUsersPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('AdminUsersPage', () => {
  it('affiche la liste des utilisateurs et des inscriptions', async () => {
    adminApi.getUsers.mockResolvedValue([USER_ROW])
    adminApi.getRegistrations.mockResolvedValue([REGISTRATION])

    renderAdminUsersPage()

    expect(await screen.findAllByText('Bob')).toHaveLength(2)
    expect(screen.getByText('Liste des utilisateurs')).toBeInTheDocument()
    expect(screen.getByText('Inscriptions aux événements')).toBeInTheDocument()
  })

  it('crée un utilisateur', async () => {
    adminApi.getUsers.mockResolvedValue([])
    adminApi.getRegistrations.mockResolvedValue([])
    adminApi.createUser.mockResolvedValue({ ...USER_ROW, id: 'user-2' })

    renderAdminUsersPage()
    await waitFor(() => expect(adminApi.getUsers).toHaveBeenCalled())

    await userEvent.type(screen.getByLabelText('Nom'), 'Charlie')
    await userEvent.type(screen.getByLabelText('Email'), 'charlie@example.com')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123')

    await userEvent.click(screen.getByRole('button', { name: 'Créer l’utilisateur' }))

    await waitFor(() =>
      expect(adminApi.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Charlie', email: 'charlie@example.com' })
      )
    )
  })

  it('précharge le formulaire et modifie un utilisateur', async () => {
    adminApi.getUsers.mockResolvedValue([USER_ROW])
    adminApi.getRegistrations.mockResolvedValue([])
    adminApi.updateUser.mockResolvedValue(USER_ROW)

    renderAdminUsersPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Modifier' }))

    expect(await screen.findByDisplayValue('Bob')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }))

    await waitFor(() =>
      expect(adminApi.updateUser).toHaveBeenCalledWith('user-1', expect.any(Object))
    )
  })

  describe('suppression utilisateur', () => {
    beforeEach(() => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
    })

    afterEach(() => {
      window.confirm.mockRestore()
    })

    it('supprime un utilisateur', async () => {
      adminApi.getUsers.mockResolvedValue([USER_ROW])
      adminApi.getRegistrations.mockResolvedValue([])
      adminApi.deleteUser.mockResolvedValue(null)

      renderAdminUsersPage()

      await userEvent.click(await screen.findByRole('button', { name: 'Supprimer' }))

      await waitFor(() => expect(adminApi.deleteUser).toHaveBeenCalledWith('user-1'))
    })
  })

  it('change le statut d’une inscription', async () => {
    adminApi.getUsers.mockResolvedValue([USER_ROW])
    adminApi.getRegistrations.mockResolvedValue([REGISTRATION])
    adminApi.updateRegistration.mockResolvedValue({ ...REGISTRATION, status: 'CANCELLED' })

    const { container } = renderAdminUsersPage()

    await screen.findByText('Inscriptions aux événements')
    const statusSelect = container.querySelector('select.registration-status')
    fireEvent.change(statusSelect, { target: { value: 'CANCELLED' } })

    await waitFor(() =>
      expect(adminApi.updateRegistration).toHaveBeenCalledWith('registration-1', 'CANCELLED')
    )
  })

  it('redirige vers /login si une requête admin renvoie 401', async () => {
    saveSession({ token: 'fake-token', user: ADMIN })
    authApi.getCurrentUser.mockResolvedValue(ADMIN)
    eventsApi.getEvents.mockResolvedValue([EVENT])
    adminApi.getUsers.mockResolvedValue([])
    const unauthorizedError = Object.assign(new Error('accès refusé'), { status: 401 })
    adminApi.getRegistrations.mockRejectedValue(unauthorizedError)

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/login" element={<p>Page de connexion</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    expect(await screen.findByText('Page de connexion')).toBeInTheDocument()
  })
})
