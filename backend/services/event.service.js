import { prisma } from '../lib/prisma.js'
import { HttpError } from '../utils/http-error.js'
import { sendEventAnnouncement } from './discord.service.js'

const EVENT_STATUSES = ['DRAFT', 'PUBLISHED', 'CANCELLED']

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${field} est requis`)
  }

  return value.trim()
}

function optionalString(value, field) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} doit être une chaîne de caractères`)
  }

  return value.trim()
}

function parseDate(value, field, required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new HttpError(400, `${field} est requis`)
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${field} doit être une date ISO valide`)
  }

  return date
}

function parseCapacity(value) {
  if (value === undefined || value === null || value === '') return null
  if (!Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, 'capacity doit être un entier positif')
  }

  return value
}

function parseStatus(value) {
  if (value === undefined) return 'DRAFT'
  if (!EVENT_STATUSES.includes(value)) {
    throw new HttpError(400, `status doit être l'une des valeurs : ${EVENT_STATUSES.join(', ')}`)
  }

  return value
}

function eventData(body) {
  const date = parseDate(body.date, 'date', true)
  const endDate = parseDate(body.endDate, 'endDate')

  if (endDate && endDate <= date) {
    throw new HttpError(400, 'endDate doit être postérieure à date')
  }

  return {
    title: requiredString(body.title, 'title'),
    description: requiredString(body.description, 'description'),
    date,
    endDate,
    location: requiredString(body.location, 'location'),
    capacity: parseCapacity(body.capacity),
    status: parseStatus(body.status),
    discordChannelId: optionalString(body.discordChannelId, 'discordChannelId'),
    discordMessageId: optionalString(body.discordMessageId, 'discordMessageId'),
  }
}

export function listEvents() {
  return prisma.event.findMany({
    orderBy: { date: 'asc' },
  })
}

export function listEventsStartingBetween(fromHours, toHours) {
  const from = new Date(Date.now() + fromHours * 60 * 60 * 1000)
  const to = new Date(Date.now() + toHours * 60 * 60 * 1000)

  return prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      date: { gte: from, lt: to },
    },
  })
}

export async function findEvent(id) {
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) throw new HttpError(404, 'événement introuvable')

  return event
}

export async function createEvent(body, creatorId) {
  const event = await prisma.event.create({
    data: {
      ...eventData(body),
      creatorId,
    },
  })

  await sendEventAnnouncement(event)

  return event
}

export async function updateEvent(id, body) {
  await findEvent(id)

  return prisma.event.update({
    where: { id },
    data: eventData(body),
  })
}

export async function deleteEvent(id) {
  await findEvent(id)
  await prisma.event.delete({ where: { id } })
}
