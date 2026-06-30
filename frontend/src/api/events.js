const API_URL = import.meta.env.VITE_API_URL

async function handleResponse(response) {
  if (response.status === 204) return null

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? "la requête sur l'événement a échoué")
  }

  return data
}

export async function getEvents() {
  const response = await fetch(`${API_URL}/events`)
  return handleResponse(response)
}

export async function getEvent(id) {
  const response = await fetch(`${API_URL}/events/${id}`)
  return handleResponse(response)
}

export async function createEvent(event, token) {
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(event),
  })

  return handleResponse(response)
}

export async function updateEvent(id, event, token) {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(event),
  })

  return handleResponse(response)
}

export async function deleteEvent(id, token) {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  return handleResponse(response)
}
