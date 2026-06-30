const API_URL = import.meta.env.VITE_API_URL

export function apiFetch(path, options) {
  if (!API_URL) {
    return Promise.reject(
      new Error(
        "VITE_API_URL n'est pas configuré : impossible de contacter l'API. Vérifiez les variables d'environnement du déploiement."
      )
    )
  }

  return fetch(`${API_URL}${path}`, options)
}
