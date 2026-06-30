import { getToken } from './authStorage'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function apiRequest(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null

  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.message ?? 'une erreur est survenue')
    error.status = response.status
    throw error
  }

  return data
}

export function getEvents() {
  return apiRequest('/events')
}

export function createEvent(event) {
  return apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

export function updateEvent(id, event) {
  return apiRequest(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  })
}

export function deleteEvent(id) {
  return apiRequest(`/events/${id}`, { method: 'DELETE' })
}
