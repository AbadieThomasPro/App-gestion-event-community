import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import { prisma } from '../lib/prisma.js'

jest.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

const FAKE_USER = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane',
  role: 'USER',
  discordId: null,
  avatar: null,
  isActive: true,
  emailVerified: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Swagger', () => {
  it('expose register et login dans le document OpenAPI', async () => {
    const res = await request(app).get('/api-docs.json')

    expect(res.status).toBe(200)
    expect(res.body.paths['/auth/register'].post).toBeDefined()
    expect(res.body.paths['/auth/login'].post).toBeDefined()
  })
})

describe('POST /auth/register', () => {
  it('crée un utilisateur et renvoie 201 sans le mot de passe', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue(FAKE_USER)

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'jane@example.com', password: 'password123', name: 'Jane' })

    expect(res.status).toBe(201)
    expect(res.body).toEqual(FAKE_USER)
    expect(res.body.password).toBeUndefined()
  })

  it.each([
    [{ password: 'password123', name: 'Jane' }, 'email manquant'],
    [{ email: 'jane@example.com', name: 'Jane' }, 'password manquant'],
    [{ email: 'jane@example.com', password: 'password123' }, 'name manquant'],
  ])('renvoie 400 si %s', async (body) => {
    const res = await request(app).post('/auth/register').send(body)

    expect(res.status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("renvoie 400 si l'email est invalide", async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'Jane' })

    expect(res.status).toBe(400)
  })

  it('renvoie 400 si le mot de passe fait moins de 8 caractères', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'jane@example.com', password: 'short', name: 'Jane' })

    expect(res.status).toBe(400)
  })

  it('renvoie 409 si un compte existe déjà avec cet email', async () => {
    prisma.user.findUnique.mockResolvedValue(FAKE_USER)

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'jane@example.com', password: 'password123', name: 'Jane' })

    expect(res.status).toBe(409)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })
})

describe('POST /auth/login', () => {
  it('renvoie un token et le user si les identifiants sont corrects', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10)
    prisma.user.findUnique.mockResolvedValue({ ...FAKE_USER, password: hashedPassword })

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.user).toEqual(FAKE_USER)
    expect(typeof res.body.token).toBe('string')

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(payload.sub).toBe(FAKE_USER.id)
  })

  it('renvoie 401 si le mot de passe est incorrect', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10)
    prisma.user.findUnique.mockResolvedValue({ ...FAKE_USER, password: hashedPassword })

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })

  it("renvoie 401 si l'email est inconnu", async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' })

    expect(res.status).toBe(401)
  })

  it('renvoie 400 si email ou password sont manquants', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'jane@example.com' })

    expect(res.status).toBe(400)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })
})

describe('POST /auth/admin-login', () => {
  it('crée la session administrateur temporaire', async () => {
    prisma.user.upsert.mockResolvedValue({ ...FAKE_USER, role: 'ADMIN', name: 'Administrateur' })

    const res = await request(app)
      .post('/auth/admin-login')
      .send({ username: 'admin', password: 'admin' })

    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('ADMIN')
    expect(typeof res.body.token).toBe('string')
  })

  it('refuse des identifiants admin incorrects', async () => {
    const res = await request(app)
      .post('/auth/admin-login')
      .send({ username: 'admin', password: 'incorrect' })

    expect(res.status).toBe(401)
    expect(prisma.user.upsert).not.toHaveBeenCalled()
  })
})

describe('GET /auth/me', () => {
  it('renvoie le user courant si le token est valide', async () => {
    prisma.user.findUnique.mockResolvedValue(FAKE_USER)
    const token = jwt.sign({ sub: FAKE_USER.id }, process.env.JWT_SECRET)

    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(FAKE_USER)
  })

  it("renvoie 401 si aucun token n'est fourni", async () => {
    const res = await request(app).get('/auth/me')

    expect(res.status).toBe(401)
  })

  it('renvoie 401 si le token est invalide', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer not-a-token')

    expect(res.status).toBe(401)
  })

  it("renvoie 401 si le token est valide mais l'utilisateur n'existe plus", async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    const token = jwt.sign({ sub: 'ghost-id' }, process.env.JWT_SECRET)

    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(401)
  })
})
