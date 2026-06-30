import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import { prisma } from '../lib/prisma.js'

jest.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    registration: {
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
  creatorId: 'user-2',
  createdAt: '2026-06-24T10:00:00.000Z',
  updatedAt: '2026-06-24T10:00:00.000Z',
}

const REGISTRATION_WITH_EVENT = {
  id: 'registration-1',
  status: 'CONFIRMED',
  userId: USER.id,
  eventId: EVENT.id,
  createdAt: '2026-06-25T10:00:00.000Z',
  event: EVENT,
}

function tokenFor(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /registrations/me', () => {
  it("liste les inscriptions de l'utilisateur connecté avec l'événement inclus", async () => {
    prisma.user.findUnique.mockResolvedValue(USER)
    prisma.registration.findMany.mockResolvedValue([REGISTRATION_WITH_EVENT])

    const res = await request(app)
      .get('/registrations/me')
      .set('Authorization', `Bearer ${tokenFor(USER)}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([REGISTRATION_WITH_EVENT])
    expect(prisma.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER.id } })
    )
  })

  it('refuse une requête sans token', async () => {
    const res = await request(app).get('/registrations/me')

    expect(res.status).toBe(401)
    expect(prisma.registration.findMany).not.toHaveBeenCalled()
  })
})
