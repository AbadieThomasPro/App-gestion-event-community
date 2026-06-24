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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

const USER = {
  id: 'user-1',
  email: 'organizer@example.com',
  name: 'Organizer',
  role: 'ORGANIZER',
}

const EVENT = {
  id: 'event-1',
  title: 'Tournoi communautaire',
  description: 'Un tournoi Discord',
  date: '2026-07-15T18:00:00.000Z',
  endDate: null,
  location: 'Discord',
  capacity: 32,
  status: 'PUBLISHED',
  discordChannelId: null,
  discordMessageId: null,
  creatorId: USER.id,
  createdAt: '2026-06-24T10:00:00.000Z',
  updatedAt: '2026-06-24T10:00:00.000Z',
}

const EVENT_INPUT = {
  title: EVENT.title,
  description: EVENT.description,
  date: EVENT.date,
  location: EVENT.location,
  capacity: EVENT.capacity,
  status: EVENT.status,
}

function organizerToken() {
  return jwt.sign({ sub: USER.id }, process.env.JWT_SECRET)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Swagger', () => {
  it('expose les cinq opérations events dans le document OpenAPI', async () => {
    const res = await request(app).get('/api-docs.json')

    expect(res.status).toBe(200)
    expect(res.body.paths['/events'].get).toBeDefined()
    expect(res.body.paths['/events'].post).toBeDefined()
    expect(res.body.paths['/events/{id}'].get).toBeDefined()
    expect(res.body.paths['/events/{id}'].put).toBeDefined()
    expect(res.body.paths['/events/{id}'].delete).toBeDefined()
  })
})

describe('Routes events', () => {
  it('GET /events renvoie la liste des événements', async () => {
    prisma.event.findMany.mockResolvedValue([EVENT])

    const res = await request(app).get('/events')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([EVENT])
  })

  it('GET /events/:id renvoie 404 si l’événement est absent', async () => {
    prisma.event.findUnique.mockResolvedValue(null)

    const res = await request(app).get('/events/missing')

    expect(res.status).toBe(404)
  })

  it('POST /events crée un événement pour un organisateur', async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.create.mockResolvedValue(EVENT)

    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken()}`)
      .send(EVENT_INPUT)

    expect(res.status).toBe(201)
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ creatorId: USER.id, title: EVENT.title }),
    })
  })

  it('POST /events refuse un utilisateur standard', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...USER, role: 'USER' })

    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken()}`)
      .send(EVENT_INPUT)

    expect(res.status).toBe(403)
    expect(prisma.event.create).not.toHaveBeenCalled()
  })

  it('PUT /events/:id modifie un événement', async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.event.update.mockResolvedValue({ ...EVENT, title: 'Nouveau titre' })

    const res = await request(app)
      .put('/events/event-1')
      .set('Authorization', `Bearer ${organizerToken()}`)
      .send({ ...EVENT_INPUT, title: 'Nouveau titre' })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Nouveau titre')
  })

  it('DELETE /events/:id supprime un événement', async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.event.delete.mockResolvedValue(EVENT)

    const res = await request(app)
      .delete('/events/event-1')
      .set('Authorization', `Bearer ${organizerToken()}`)

    expect(res.status).toBe(204)
    expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } })
  })
})
