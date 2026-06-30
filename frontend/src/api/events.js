import { handleResponse } from './handleResponse'

const API_URL = import.meta.env.VITE_API_URL
const FALLBACK_MESSAGE = "la requête sur l'événement a échoué"

export async function getEvents() {
  const response = await fetch(`${API_URL}/events`)
  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function getEvent(id) {
  const response = await fetch(`${API_URL}/events/${id}`)
  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function createEvent(event, token) {
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(event),
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function updateEvent(id, event, token) {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(event),
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}

export async function deleteEvent(id, token) {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  return handleResponse(response, FALLBACK_MESSAGE)
}
