const API_URL = import.meta.env.VITE_API_URL

export async function register({ email, password, name }) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message ?? "l'inscription a échoué")
  }

  return data
}

export async function login({ email, password }) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message ?? 'la connexion a échoué')
  }

  return data
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('session invalide')
  }

  return response.json()
}
