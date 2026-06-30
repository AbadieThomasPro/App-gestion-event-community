import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import { prisma } from '../lib/prisma.js'
import * as discordService from '../services/discord.service.js'

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

jest.mock('../services/discord.service.js', () => ({
  sendEventAnnouncement: jest.fn().mockResolvedValue(undefined),
}))

const ORGANIZER = {
  id: 'user-1',
  email: 'organizer@example.com',
  name: 'Organizer',
  role: 'ORGANIZER',
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
  capacity: 32,
  status: 'PUBLISHED',
  discordChannelId: null,
  discordMessageId: null,
  creatorId: ORGANIZER.id,
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

function tokenFor(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET)
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

describe('GET /events', () => {
  it('renvoie la liste des événements', async () => {
    prisma.event.findMany.mockResolvedValue([EVENT])

    const res = await request(app).get('/events')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([EVENT])
  })
})

describe('GET /events/:id', () => {
  it('renvoie un événement existant', async () => {
    prisma.event.findUnique.mockResolvedValue(EVENT)

    const res = await request(app).get('/events/event-1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(EVENT)
  })

  it('renvoie 404 si l’événement est absent', async () => {
    prisma.event.findUnique.mockResolvedValue(null)

    const res = await request(app).get('/events/missing')

    expect(res.status).toBe(404)
  })
})

describe('POST /events', () => {
  it('crée un événement pour un organisateur', async () => {
    prisma.user.findUnique.mockResolvedValue(ORGANIZER)
    prisma.event.create.mockResolvedValue(EVENT)

    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)
      .send(EVENT_INPUT)

    expect(res.status).toBe(201)
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ creatorId: ORGANIZER.id, title: EVENT.title }),
    })
    expect(discordService.sendEventAnnouncement).toHaveBeenCalledWith(EVENT)
  })

  it('crée un événement pour un admin', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN)
    prisma.event.create.mockResolvedValue({ ...EVENT, creatorId: ADMIN.id })

    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${tokenFor(ADMIN)}`)
      .send(EVENT_INPUT)

    expect(res.status).toBe(201)
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ creatorId: ADMIN.id }),
    })
  })

  it('refuse un utilisateur standard', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...ORGANIZER, role: 'USER' })

    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)
      .send(EVENT_INPUT)

    expect(res.status).toBe(403)
    expect(prisma.event.create).not.toHaveBeenCalled()
  })

  it('refuse une requête sans token', async () => {
    const res = await request(app).post('/events').send(EVENT_INPUT)

    expect(res.status).toBe(401)
    expect(prisma.event.create).not.toHaveBeenCalled()
  })

  it.each([
    [{ ...EVENT_INPUT, title: '' }, 'title manquant'],
    [{ ...EVENT_INPUT, description: '' }, 'description manquant'],
    [{ ...EVENT_INPUT, location: '' }, 'location manquant'],
    [{ ...EVENT_INPUT, date: undefined }, 'date manquant'],
    [{ ...EVENT_INPUT, date: 'pas-une-date' }, 'date invalide'],
    [{ ...EVENT_INPUT, endDate: '2020-01-01T00:00:00.000Z' }, 'endDate antérieure à date'],
    [{ ...EVENT_INPUT, capacity: -5 }, 'capacity négative'],
    [{ ...EVENT_INPUT, status: 'INVALID' }, 'status invalide'],
  ])('renvoie 400 si %s', async (body) => {
    prisma.user.findUnique.mockResolvedValue(ORGANIZER)

    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)
      .send(body)

    expect(res.status).toBe(400)
    expect(prisma.event.create).not.toHaveBeenCalled()
  })
})

describe('PUT /events/:id', () => {
  it('modifie un événement', async () => {
    prisma.user.findUnique.mockResolvedValue(ORGANIZER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.event.update.mockResolvedValue({ ...EVENT, title: 'Nouveau titre' })

    const res = await request(app)
      .put('/events/event-1')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)
      .send({ ...EVENT_INPUT, title: 'Nouveau titre' })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Nouveau titre')
  })

  it('renvoie 404 si l’événement est absent', async () => {
    prisma.user.findUnique.mockResolvedValue(ORGANIZER)
    prisma.event.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .put('/events/missing')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)
      .send(EVENT_INPUT)

    expect(res.status).toBe(404)
    expect(prisma.event.update).not.toHaveBeenCalled()
  })

  it('renvoie 400 si le corps est invalide', async () => {
    prisma.user.findUnique.mockResolvedValue(ORGANIZER)
    prisma.event.findUnique.mockResolvedValue(EVENT)

    const res = await request(app)
      .put('/events/event-1')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)
      .send({ ...EVENT_INPUT, title: '' })

    expect(res.status).toBe(400)
    expect(prisma.event.update).not.toHaveBeenCalled()
  })

  it('refuse un utilisateur standard', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...ORGANIZER, role: 'USER' })

    const res = await request(app)
      .put('/events/event-1')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)
      .send(EVENT_INPUT)

    expect(res.status).toBe(403)
    expect(prisma.event.update).not.toHaveBeenCalled()
  })

  it('refuse une requête sans token', async () => {
    const res = await request(app).put('/events/event-1').send(EVENT_INPUT)

    expect(res.status).toBe(401)
    expect(prisma.event.update).not.toHaveBeenCalled()
  })
})

describe('DELETE /events/:id', () => {
  it('supprime un événement', async () => {
    prisma.user.findUnique.mockResolvedValue(ORGANIZER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.event.delete.mockResolvedValue(EVENT)

    const res = await request(app)
      .delete('/events/event-1')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)

    expect(res.status).toBe(204)
    expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } })
  })

  it('renvoie 404 si l’événement est absent', async () => {
    prisma.user.findUnique.mockResolvedValue(ORGANIZER)
    prisma.event.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .delete('/events/missing')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)

    expect(res.status).toBe(404)
    expect(prisma.event.delete).not.toHaveBeenCalled()
  })

  it('refuse un utilisateur standard', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...ORGANIZER, role: 'USER' })

    const res = await request(app)
      .delete('/events/event-1')
      .set('Authorization', `Bearer ${tokenFor(ORGANIZER)}`)

    expect(res.status).toBe(403)
    expect(prisma.event.delete).not.toHaveBeenCalled()
  })

  it('refuse une requête sans token', async () => {
    const res = await request(app).delete('/events/event-1')

    expect(res.status).toBe(401)
    expect(prisma.event.delete).not.toHaveBeenCalled()
  })
})
