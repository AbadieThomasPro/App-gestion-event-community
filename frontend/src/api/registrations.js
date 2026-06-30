import { apiFetch } from './client'
import { handleResponse } from './handleResponse'

const FALLBACK_MESSAGE = "la requête d'inscription a échoué"

export async function getMyRegistrationForEvent(eventId, token) {
  const response = await apiFetch(`/events/${eventId}/register`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function registerForEvent(eventId, token) {
  const response = await apiFetch(`/events/${eventId}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function unregisterFromEvent(eventId, token) {
  const response = await apiFetch(`/events/${eventId}/register`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function getMyRegistrations(token) {
  const response = await apiFetch('/registrations/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}
