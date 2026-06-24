import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from './RegisterPage'
import { AuthProvider } from '../../context/AuthContext'
import * as authApi from '../../api/auth'

vi.mock('../../api/auth')

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('RegisterPage', () => {
  it('inscrit puis connecte automatiquement l’utilisateur', async () => {
    authApi.register.mockResolvedValue({ id: '1', name: 'Jane', email: 'jane@example.com' })
    authApi.login.mockResolvedValue({
      token: 'fake-token',
      user: { id: '1', name: 'Jane', email: 'jane@example.com' },
    })

    renderRegisterPage()
    await userEvent.type(screen.getByLabelText('Nom'), 'Jane')
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: "S'inscrire" }))

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'password123',
      })
    )
    await waitFor(() => expect(authApi.login).toHaveBeenCalled())
  })

  it("affiche une erreur si l'email est déjà utilisé", async () => {
    authApi.register.mockRejectedValue(new Error('un compte existe déjà avec cet email'))

    renderRegisterPage()
    await userEvent.type(screen.getByLabelText('Nom'), 'Jane')
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: "S'inscrire" }))

    expect(await screen.findByText('un compte existe déjà avec cet email')).toBeInTheDocument()
  })

  it('contient un lien vers la page de connexion', () => {
    renderRegisterPage()
    expect(screen.getByRole('link', { name: 'Se connecter' })).toBeInTheDocument()
  })
})
