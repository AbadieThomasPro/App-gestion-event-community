import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header'
import { AuthProvider } from '../../context/AuthContext'
import { saveSession } from '../../api/authStorage'
import * as authApi from '../../api/auth'

vi.mock('../../api/auth')

const ORGANIZER = { id: 'user-1', name: 'Jane', email: 'jane@example.com', role: 'ORGANIZER' }
const ADMIN = { id: 'user-2', name: 'Alice', email: 'alice@example.com', role: 'ADMIN' }

function renderHeader(user) {
  saveSession({ token: 'fake-token', user })
  authApi.getCurrentUser.mockResolvedValue(user)

  return render(
    <MemoryRouter>
      <AuthProvider>
        <Header />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('Header', () => {
  it("affiche le nom, le rôle de l'utilisateur et les liens de navigation", async () => {
    renderHeader(ORGANIZER)

    expect(await screen.findByText('Jane')).toBeInTheDocument()
    expect(screen.getByText('Organisateur')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Événements' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mes inscriptions' })).toBeInTheDocument()
  })

  it('appelle signOut au clic sur déconnexion', async () => {
    renderHeader(ORGANIZER)

    await userEvent.click(await screen.findByRole('button', { name: 'Se déconnecter' }))

    expect(localStorage.getItem('token')).toBeNull()
  })

  it("n'affiche pas le lien Admin pour un utilisateur non-admin", async () => {
    renderHeader(ORGANIZER)

    await screen.findByText('Jane')
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('affiche le lien Admin pour un administrateur', async () => {
    renderHeader(ADMIN)

    expect(await screen.findByRole('link', { name: 'Admin' })).toBeInTheDocument()
  })
})
