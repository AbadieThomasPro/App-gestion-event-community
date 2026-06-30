import { describe, it, expect, afterEach, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('apiFetch', () => {
  it("rejette avec un message clair si VITE_API_URL n'est pas configuré", async () => {
    vi.stubEnv('VITE_API_URL', '')
    const { apiFetch } = await import('./client')

    await expect(apiFetch('/auth/login')).rejects.toThrow(
      "VITE_API_URL n'est pas configuré : impossible de contacter l'API. Vérifiez les variables d'environnement du déploiement."
    )
  })
})
