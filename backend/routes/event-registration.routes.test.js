import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import { prisma } from '../lib/prisma.js'

jest.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    registration: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

const USER = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane',
  role: 'USER',
}

const ADMIN = {
  id: 'user-2',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'ADMIN',
}

const EVENT = {
  id: 'event-1',
  title: 'Tournoi communautaire',
  description: 'Un tournoi Discord',
  date: '2026-07-15T18:00:00.000Z',
  endDate: null,
  location: 'Discord',
  capacity: 2,
  status: 'PUBLISHED',
  discordChannelId: null,
  discordMessageId: null,
  creatorId: ADMIN.id,
  createdAt: '2026-06-24T10:00:00.000Z',
  updatedAt: '2026-06-24T10:00:00.000Z',
}

const REGISTRATION = {
  id: 'registration-1',
  status: 'CONFIRMED',
  userId: USER.id,
  eventId: EVENT.id,
  createdAt: '2026-06-25T10:00:00.000Z',
}

function tokenFor(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Swagger', () => {
  it('expose les opérations de registration dans le document OpenAPI', async () => {
    const res = await request(app).get('/api-docs.json')

    expect(res.status).toBe(200)
    expect(res.body.paths['/events/{id}/register'].post).toBeDefined()
    expect(res.body.paths['/events/{id}/register'].delete).toBeDefined()
    expect(res.body.paths['/events/{id}/registrations'].get).toBeDefined()
  })
})

describe('POST /events/:id/register', () => {
  it('inscrit un utilisateur à un événement', async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.registration.findUnique.mockResolvedValue(null)
    prisma.registration.count.mockResolvedValue(0)
    prisma.registration.create.mockResolvedValue(REGISTRATION)

    const res = await request(app)
      .post('/events/event-1/register')
      .set('Authorization', `Bearer ${tokenFor(USER)}`)

    expect(res.status).toBe(201)
    expect(res.body).toEqual(REGISTRATION)
    expect(prisma.registration.create).toHaveBeenCalledWith({
      data: { userId: USER.id, eventId: EVENT.id, status: 'CONFIRMED' },
    })
  })

  it('refuse une requête sans token', async () => {
    const res = await request(app).post('/events/event-1/register')

    expect(res.status).toBe(401)
    expect(prisma.registration.create).not.toHaveBeenCalled()
  })

  it("renvoie 404 si l'événement est absent", async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/events/missing/register')
      .set('Authorization', `Bearer ${tokenFor(USER)}`)

    expect(res.status).toBe(404)
    expect(prisma.registration.create).not.toHaveBeenCalled()
  })

  it('renvoie 409 si déjà inscrit', async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.registration.findUnique.mockResolvedValue(REGISTRATION)

    const res = await request(app)
      .post('/events/event-1/register')
      .set('Authorization', `Bearer ${tokenFor(USER)}`)

    expect(res.status).toBe(409)
    expect(prisma.registration.create).not.toHaveBeenCalled()
  })

  it("renvoie 409 si l'événement est complet", async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.registration.findUnique.mockResolvedValue(null)
    prisma.registration.count.mockResolvedValue(EVENT.capacity)

    const res = await request(app)
      .post('/events/event-1/register')
      .set('Authorization', `Bearer ${tokenFor(USER)}`)

    expect(res.status).toBe(409)
    expect(prisma.registration.create).not.toHaveBeenCalled()
  })
})

describe('DELETE /events/:id/register', () => {
  it('désinscrit un utilisateur', async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.registration.findUnique.mockResolvedValue(REGISTRATION)
    prisma.registration.delete.mockResolvedValue(REGISTRATION)

    const res = await request(app)
      .delete('/events/event-1/register')
      .set('Authorization', `Bearer ${tokenFor(USER)}`)

    expect(res.status).toBe(204)
    expect(prisma.registration.delete).toHaveBeenCalledWith({
      where: { id: REGISTRATION.id },
    })
  })

  it('refuse une requête sans token', async () => {
    const res = await request(app).delete('/events/event-1/register')

    expect(res.status).toBe(401)
    expect(prisma.registration.delete).not.toHaveBeenCalled()
  })

  it("renvoie 404 si l'événement est absent", async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .delete('/events/missing/register')
      .set('Authorization', `Bearer ${tokenFor(USER)}`)

    expect(res.status).toBe(404)
    expect(prisma.registration.delete).not.toHaveBeenCalled()
  })

  it("renvoie 404 si l'inscription est absente", async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.registration.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .delete('/events/event-1/register')
      .set('Authorization', `Bearer ${tokenFor(USER)}`)

    expect(res.status).toBe(404)
    expect(prisma.registration.delete).not.toHaveBeenCalled()
  })
})

describe('GET /events/:id/registrations', () => {
  it('liste les inscrits pour un admin', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.registration.findMany.mockResolvedValue([REGISTRATION])

    const res = await request(app)
      .get('/events/event-1/registrations')
      .set('Authorization', `Bearer ${tokenFor(ADMIN)}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([REGISTRATION])
  })

  it('refuse un utilisateur standard', async () => {
    prisma.user.findUnique.mockResolvedValue(USER)

    const res = await request(app)
      .get('/events/event-1/registrations')
      .set('Authorization', `Bearer ${tokenFor(USER)}`)

    expect(res.status).toBe(403)
    expect(prisma.registration.findMany).not.toHaveBeenCalled()
  })

  it('refuse une requête sans token', async () => {
    const res = await request(app).get('/events/event-1/registrations')

    expect(res.status).toBe(401)
    expect(prisma.registration.findMany).not.toHaveBeenCalled()
  })

  it("renvoie 404 si l'événement est absent", async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN)
    prisma.event.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .get('/events/missing/registrations')
      .set('Authorization', `Bearer ${tokenFor(ADMIN)}`)

    expect(res.status).toBe(404)
    expect(prisma.registration.findMany).not.toHaveBeenCalled()
  })
})
