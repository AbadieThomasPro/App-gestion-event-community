import { getStoredToken } from './authStorage'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function adminRequest(path, options = {}) {
  const response = await fetch(`${API_URL}/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getStoredToken()}`,
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

export const getUsers = () => adminRequest('/users')
export const createUser = (user) =>
  adminRequest('/users', { method: 'POST', body: JSON.stringify(user) })
export const updateUser = (id, user) =>
  adminRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) })
export const deleteUser = (id) => adminRequest(`/users/${id}`, { method: 'DELETE' })

export function getRegistrations(filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => Boolean(value))
  ).toString()
  return adminRequest(`/registrations${query ? `?${query}` : ''}`)
}

export const createRegistration = (registration) =>
  adminRequest('/registrations', {
    method: 'POST',
    body: JSON.stringify(registration),
  })
export const updateRegistration = (id, status) =>
  adminRequest(`/registrations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
export const deleteRegistration = (id) => adminRequest(`/registrations/${id}`, { method: 'DELETE' })
