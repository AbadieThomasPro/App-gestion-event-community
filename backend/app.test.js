import request from 'supertest'
import app from './app.js'
import { prisma } from './lib/prisma.js'

jest.mock('./lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  console.error.mockRestore()
})

describe('Gestion des erreurs globales', () => {
  it('renvoie du JSON (et non du HTML) quand une erreur inattendue est levée', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('connexion base de données impossible'))

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'password123' })

    expect(res.status).toBe(500)
    expect(res.type).toBe('application/json')
    expect(res.body).toEqual({ message: 'une erreur interne est survenue' })
  })

  it('renvoie du JSON pour une route inconnue', async () => {
    const res = await request(app).get('/route-qui-nexiste-pas')

    expect(res.status).toBe(404)
    expect(res.type).toBe('application/json')
    expect(res.body).toEqual({ message: 'route introuvable' })
  })
})
