import { apiFetch } from './client'
import { handleResponse } from './handleResponse'

export async function register({ email, password, name }) {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })

  return handleResponse(response, "l'inscription a échoué")
}

export async function login({ email, password }) {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return handleResponse(response, 'la connexion a échoué')
}

export async function getCurrentUser(token) {
  const response = await apiFetch('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  return handleResponse(response, 'session invalide')
}
