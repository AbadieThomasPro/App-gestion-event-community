import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import { AuthProvider } from '../context/AuthContext'
import { saveSession } from '../api/authStorage'
import * as authApi from '../api/auth'

vi.mock('../api/auth')

const USER = { id: 'user-1', name: 'Bob', email: 'bob@example.com', role: 'USER' }
const ADMIN = { id: 'user-2', name: 'Alice', email: 'alice@example.com', role: 'ADMIN' }

function renderProtectedRoute({ user, roles, route = '/protected' } = {}) {
  if (user) {
    saveSession({ token: 'fake-token', user })
    authApi.getCurrentUser.mockResolvedValue(user)
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Page de connexion</p>} />
          <Route path="/" element={<p>Page d&apos;accueil</p>} />
          <Route
            path="/protected"
            element={
              <RequireAuth roles={roles}>
                <p>Contenu protégé</p>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('RequireAuth', () => {
  it('redirige vers /login si non connecté', async () => {
    renderProtectedRoute({})

    expect(await screen.findByText('Page de connexion')).toBeInTheDocument()
  })

  it('affiche le contenu si connecté et sans restriction de rôle', async () => {
    renderProtectedRoute({ user: USER })

    expect(await screen.findByText('Contenu protégé')).toBeInTheDocument()
  })

  it("redirige vers / si le rôle de l'utilisateur ne correspond pas", async () => {
    renderProtectedRoute({ user: USER, roles: ['ADMIN'] })

    expect(await screen.findByText("Page d'accueil")).toBeInTheDocument()
  })

  it('affiche le contenu si le rôle correspond', async () => {
    renderProtectedRoute({ user: ADMIN, roles: ['ADMIN'] })

    expect(await screen.findByText('Contenu protégé')).toBeInTheDocument()
  })
})
