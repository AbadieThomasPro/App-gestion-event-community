import { apiFetch } from './client'
import { handleResponse } from './handleResponse'

const FALLBACK_MESSAGE = "la requête sur l'événement a échoué"

export async function getEvents() {
  const response = await apiFetch('/events')
  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function getEvent(id) {
  const response = await apiFetch(`/events/${id}`)
  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function createEvent(event, token) {
  const response = await apiFetch('/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(event),
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function updateEvent(id, event, token) {
  const response = await apiFetch(`/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(event),
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function deleteEvent(id, token) {
  const response = await apiFetch(`/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}
