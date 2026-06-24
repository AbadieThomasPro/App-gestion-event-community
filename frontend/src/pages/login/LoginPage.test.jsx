import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import { AuthProvider } from '../../context/AuthContext'
import * as authApi from '../../api/auth'

vi.mock('../../api/auth')

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('LoginPage', () => {
  it('connecte un utilisateur avec des identifiants valides', async () => {
    authApi.login.mockResolvedValue({
      token: 'fake-token',
      user: { id: '1', name: 'Jane', email: 'jane@example.com' },
    })

    renderLoginPage()
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'password123',
      })
    )
  })

  it("affiche un message d'erreur si les identifiants sont invalides", async () => {
    authApi.login.mockRejectedValue(new Error('email ou mot de passe incorrect'))

    renderLoginPage()
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('email ou mot de passe incorrect')).toBeInTheDocument()
  })

  it('contient un lien vers la page d’inscription', () => {
    renderLoginPage()
    expect(screen.getByRole('link', { name: "S'inscrire" })).toBeInTheDocument()
  })
})
