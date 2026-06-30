import request from 'supertest'
import app from '../app.js'
import { prisma } from '../lib/prisma.js'
import * as discordService from '../services/discord.service.js'

jest.mock('../lib/prisma.js', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('../services/discord.service.js', () => ({
  sendEventReminder: jest.fn().mockResolvedValue(undefined),
  sendErrorAlert: jest.fn().mockResolvedValue(undefined),
}))

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET

const EVENT = {
  id: 'event-1',
  title: 'Tournoi communautaire',
  date: '2026-07-16T18:00:00.000Z',
  location: 'Discord',
  status: 'PUBLISHED',
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.CRON_SECRET = 'test-cron-secret'
})

afterEach(() => {
  if (ORIGINAL_CRON_SECRET === undefined) {
    delete process.env.CRON_SECRET
  } else {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET
  }
})

describe('GET /cron/reminder', () => {
  it('refuse une requête sans le bon secret', async () => {
    const res = await request(app).get('/cron/reminder')

    expect(res.status).toBe(401)
    expect(prisma.event.findMany).not.toHaveBeenCalled()
  })

  it('refuse une requête avec un mauvais secret', async () => {
    const res = await request(app)
      .get('/cron/reminder')
      .set('Authorization', 'Bearer mauvais-secret')

    expect(res.status).toBe(401)
  })

  it('refuse si CRON_SECRET n’est pas configuré côté serveur', async () => {
    delete process.env.CRON_SECRET

    const res = await request(app)
      .get('/cron/reminder')
      .set('Authorization', 'Bearer test-cron-secret')

    expect(res.status).toBe(401)
  })

  it('envoie un rappel pour chaque événement de la fenêtre 24-48h et renvoie le total', async () => {
    prisma.event.findMany.mockResolvedValue([EVENT])

    const res = await request(app)
      .get('/cron/reminder')
      .set('Authorization', 'Bearer test-cron-secret')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ remindersSent: 1 })
    expect(discordService.sendEventReminder).toHaveBeenCalledWith(EVENT)
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'PUBLISHED' }) })
    )
  })

  it("ne renvoie rien si aucun événement n'est dans la fenêtre", async () => {
    prisma.event.findMany.mockResolvedValue([])

    const res = await request(app)
      .get('/cron/reminder')
      .set('Authorization', 'Bearer test-cron-secret')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ remindersSent: 0 })
    expect(discordService.sendEventReminder).not.toHaveBeenCalled()
  })
})
