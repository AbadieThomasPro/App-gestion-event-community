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

async function readResponse(response) {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message ?? 'la connexion a échoué')
  }

  return data
}

export async function getCurrentUser(token) {
  const response = await apiFetch('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  return handleResponse(response, 'session invalide')
}
export async function login({ email, password }) {
  const response = await fetch(`/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return readResponse(response)
}

export async function loginAdmin({ username, password }) {
  const response = await fetch(`/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  return readResponse(response)
}
