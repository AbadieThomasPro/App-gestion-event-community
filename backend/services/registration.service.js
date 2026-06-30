import { prisma } from '../lib/prisma.js'
import { HttpError } from '../utils/http-error.js'
import { findEvent } from './event.service.js'

const REGISTRANT_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
}

export async function registerForEvent(eventId, userId) {
  const event = await findEvent(eventId)

  const existing = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  })
  if (existing) {
    throw new HttpError(409, 'déjà inscrit à cet événement')
  }

  if (event.capacity) {
    const confirmedCount = await prisma.registration.count({
      where: { eventId, status: 'CONFIRMED' },
    })
    if (confirmedCount >= event.capacity) {
      throw new HttpError(409, 'événement complet')
    }
  }

  return prisma.registration.create({
    data: { userId, eventId, status: 'CONFIRMED' },
  })
}

export async function unregisterFromEvent(eventId, userId) {
  await findEvent(eventId)

  const existing = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  })
  if (!existing) {
    throw new HttpError(404, 'inscription introuvable')
  }

  await prisma.registration.delete({ where: { id: existing.id } })
}

export async function listRegistrations(eventId) {
  await findEvent(eventId)

  return prisma.registration.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: REGISTRANT_FIELDS } },
  })
}

export async function findMyRegistration(eventId, userId) {
  await findEvent(eventId)

  return prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  })
}

export function listMyRegistrations(userId) {
  return prisma.registration.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: { event: true },
  })
}
