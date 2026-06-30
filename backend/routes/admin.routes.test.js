import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import { prisma } from '../lib/prisma.js'

jest.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    registration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const ADMIN = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'ADMIN',
  isActive: true,
}

const USER = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane',
  role: 'USER',
  discordId: null,
  avatar: null,
  isActive: true,
  emailVerified: false,
  createdAt: '2026-06-24T10:00:00.000Z',
  updatedAt: '2026-06-24T10:00:00.000Z',
  _count: { events: 0, registrations: 1 },
}

const EVENT = {
  id: 'event-1',
  title: 'Tournoi',
  date: '2026-07-15T18:00:00.000Z',
  status: 'PUBLISHED',
}

function tokenFor(user = ADMIN) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET)
}

beforeEach(() => {
  jest.clearAllMocks()
  prisma.user.findUnique.mockResolvedValue(ADMIN)
})

describe('Routes admin utilisateurs', () => {
  it('refuse un utilisateur non administrateur', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...ADMIN, role: 'USER' })

    const res = await request(app).get('/admin/users').set('Authorization', `Bearer ${tokenFor()}`)

    expect(res.status).toBe(403)
  })

  it('GET /admin/users renvoie les comptes', async () => {
    prisma.user.findMany.mockResolvedValue([USER])

    const res = await request(app).get('/admin/users').set('Authorization', `Bearer ${tokenFor()}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([USER])
  })

  it('POST /admin/users crée un compte avec un rôle', async () => {
    prisma.user.create.mockResolvedValue({ ...USER, role: 'ORGANIZER' })

    const res = await request(app)
      .post('/admin/users')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'password123',
        role: 'ORGANIZER',
      })

    expect(res.status).toBe(201)
    expect(res.body.role).toBe('ORGANIZER')
    expect(prisma.user.create).toHaveBeenCalled()
  })
})

describe('Routes admin inscriptions', () => {
  it('GET /admin/registrations renvoie les inscriptions', async () => {
    const registration = {
      id: 'registration-1',
      status: 'CONFIRMED',
      user: USER,
      event: EVENT,
    }
    prisma.registration.findMany.mockResolvedValue([registration])

    const res = await request(app)
      .get('/admin/registrations?status=CONFIRMED')
      .set('Authorization', `Bearer ${tokenFor()}`)

    expect(res.status).toBe(200)
    expect(res.body[0].status).toBe('CONFIRMED')
    expect(prisma.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'CONFIRMED' } })
    )
  })

  it('POST /admin/registrations ajoute une inscription', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(ADMIN).mockResolvedValueOnce(USER)
    prisma.event.findUnique.mockResolvedValue(EVENT)
    prisma.registration.create.mockResolvedValue({
      id: 'registration-1',
      userId: USER.id,
      eventId: EVENT.id,
      status: 'WAITLISTED',
      user: USER,
      event: EVENT,
    })

    const res = await request(app)
      .post('/admin/registrations')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ userId: USER.id, eventId: EVENT.id, status: 'WAITLISTED' })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe('WAITLISTED')
  })

  it('PUT /admin/registrations/:id change le statut', async () => {
    prisma.registration.findUnique.mockResolvedValue({ id: 'registration-1' })
    prisma.registration.update.mockResolvedValue({
      id: 'registration-1',
      status: 'CANCELLED',
      user: USER,
      event: EVENT,
    })

    const res = await request(app)
      .put('/admin/registrations/registration-1')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ status: 'CANCELLED' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('CANCELLED')
  })
})
