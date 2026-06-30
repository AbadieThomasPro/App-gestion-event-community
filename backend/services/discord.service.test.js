import {
  sendDiscordMessage,
  sendEventAnnouncement,
  sendEventReminder,
  sendErrorAlert,
} from './discord.service.js'

const ORIGINAL_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

const EVENT = {
  id: 'event-1',
  title: 'Tournoi communautaire',
  date: '2026-07-15T18:00:00.000Z',
  location: 'Discord - Salon vocal général',
}

beforeEach(() => {
  jest.restoreAllMocks()
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  if (ORIGINAL_WEBHOOK_URL === undefined) {
    delete process.env.DISCORD_WEBHOOK_URL
  } else {
    process.env.DISCORD_WEBHOOK_URL = ORIGINAL_WEBHOOK_URL
  }
})

describe('sendDiscordMessage', () => {
  it("n'envoie rien si DISCORD_WEBHOOK_URL n'est pas configuré", async () => {
    delete process.env.DISCORD_WEBHOOK_URL
    global.fetch = jest.fn()

    await sendDiscordMessage('hello')

    expect(global.fetch).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalled()
  })

  it('poste le message sur le webhook configuré', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test'
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 })

    await sendDiscordMessage('hello')

    expect(global.fetch).toHaveBeenCalledWith('https://discord.com/api/webhooks/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hello' }),
    })
  })

  it("n'explose pas si le webhook répond en erreur", async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test'
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 })

    await expect(sendDiscordMessage('hello')).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })

  it("n'explose pas si fetch rejette (réseau down)", async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test'
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'))

    await expect(sendDiscordMessage('hello')).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })
})

describe('helpers de formatage', () => {
  beforeEach(() => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test'
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 })
  })

  it('sendEventAnnouncement inclut le titre, la date et le lieu', async () => {
    await sendEventAnnouncement(EVENT)

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.content).toContain('Tournoi communautaire')
    expect(body.content).toContain('Discord - Salon vocal général')
  })

  it('sendEventReminder inclut le titre et la date', async () => {
    await sendEventReminder(EVENT)

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.content).toContain('Rappel')
    expect(body.content).toContain('Tournoi communautaire')
  })

  it('sendErrorAlert inclut le message d’erreur et le contexte', async () => {
    await sendErrorAlert(new Error('boom'), 'POST /events')

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.content).toContain('boom')
    expect(body.content).toContain('POST /events')
  })
})
