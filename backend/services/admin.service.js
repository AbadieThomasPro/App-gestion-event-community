import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../utils/http-error.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES = ['USER', 'ORGANIZER', 'ADMIN']
const REGISTRATION_STATUSES = ['CONFIRMED', 'CANCELLED', 'WAITLISTED']

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  discordId: true,
  avatar: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      events: true,
      registrations: true,
    },
  },
}

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

function parseEmail(value) {
  const email = requiredString(value, 'email').toLowerCase()
  if (!EMAIL_REGEX.test(email)) throw new HttpError(400, 'email invalide')
  return email
}

function parseRole(value) {
  if (!ROLES.includes(value)) {
    throw new HttpError(400, `role doit être l'une des valeurs : ${ROLES.join(', ')}`)
  }
  return value
}

function parseRegistrationStatus(value) {
  if (!REGISTRATION_STATUSES.includes(value)) {
    throw new HttpError(
      400,
      `status doit être l'une des valeurs : ${REGISTRATION_STATUSES.join(', ')}`
    )
  }
  return value
}

function handlePrismaConflict(error) {
  if (error?.code === 'P2002') {
    throw new HttpError(409, 'cet email ou identifiant Discord est déjà utilisé')
  }
  throw error
}

export function listUsers() {
  return prisma.user.findMany({
    select: PUBLIC_USER_FIELDS,
    orderBy: { createdAt: 'desc' },
  })
}

export async function createUser(body) {
  const password = requiredString(body.password, 'password')
  if (password.length < 8) {
    throw new HttpError(400, 'le mot de passe doit contenir au moins 8 caractères')
  }

  try {
    return await prisma.user.create({
      data: {
        name: requiredString(body.name, 'name'),
        email: parseEmail(body.email),
        password: await bcrypt.hash(password, 10),
        role: parseRole(body.role ?? 'USER'),
        discordId: optionalString(body.discordId, 'discordId'),
        avatar: optionalString(body.avatar, 'avatar'),
        isActive: body.isActive ?? true,
        emailVerified: body.emailVerified ?? false,
      },
      select: PUBLIC_USER_FIELDS,
    })
  } catch (error) {
    handlePrismaConflict(error)
  }
}

export async function updateUser(id, body, currentAdminId) {
  const existingUser = await prisma.user.findUnique({ where: { id } })
  if (!existingUser) throw new HttpError(404, 'utilisateur introuvable')

  if (id === currentAdminId && (body.role !== 'ADMIN' || body.isActive === false)) {
    throw new HttpError(400, 'vous ne pouvez pas retirer votre propre accès administrateur')
  }

  const data = {
    name: requiredString(body.name, 'name'),
    email: parseEmail(body.email),
    role: parseRole(body.role),
    discordId: optionalString(body.discordId, 'discordId'),
    avatar: optionalString(body.avatar, 'avatar'),
    isActive: body.isActive ?? true,
    emailVerified: body.emailVerified ?? false,
  }

  if (body.password) {
    if (body.password.length < 8) {
      throw new HttpError(400, 'le mot de passe doit contenir au moins 8 caractères')
    }
    data.password = await bcrypt.hash(body.password, 10)
  }

  try {
    return await prisma.user.update({
      where: { id },
      data,
      select: PUBLIC_USER_FIELDS,
    })
  } catch (error) {
    handlePrismaConflict(error)
  }
}

export async function deleteUser(id, currentAdminId) {
  if (id === currentAdminId) {
    throw new HttpError(400, 'vous ne pouvez pas supprimer votre propre compte')
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          events: true,
        },
      },
    },
  })

  if (!user) throw new HttpError(404, 'utilisateur introuvable')
  if (user._count.events > 0) {
    throw new HttpError(
      409,
      'cet utilisateur a créé des événements : désactivez-le pour conserver l’historique'
    )
  }

  await prisma.$transaction([
    prisma.registration.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ])
}

export function listRegistrations(filters = {}) {
  const where = {}
  if (filters.eventId) where.eventId = filters.eventId
  if (filters.userId) where.userId = filters.userId
  if (filters.status) where.status = parseRegistrationStatus(filters.status)

  return prisma.registration.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createRegistration(body) {
  const userId = requiredString(body.userId, 'userId')
  const eventId = requiredString(body.eventId, 'eventId')

  const [user, event] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.event.findUnique({ where: { id: eventId } }),
  ])

  if (!user) throw new HttpError(404, 'utilisateur introuvable')
  if (!event) throw new HttpError(404, 'événement introuvable')

  try {
    return await prisma.registration.create({
      data: {
        userId,
        eventId,
        status: parseRegistrationStatus(body.status ?? 'CONFIRMED'),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        event: { select: { id: true, title: true, date: true, status: true } },
      },
    })
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new HttpError(409, 'cet utilisateur est déjà inscrit à cet événement')
    }
    throw error
  }
}

export async function updateRegistration(id, body) {
  const registration = await prisma.registration.findUnique({ where: { id } })
  if (!registration) throw new HttpError(404, 'inscription introuvable')

  return prisma.registration.update({
    where: { id },
    data: { status: parseRegistrationStatus(body.status) },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      event: { select: { id: true, title: true, date: true, status: true } },
    },
  })
}

export async function deleteRegistration(id) {
  const registration = await prisma.registration.findUnique({ where: { id } })
  if (!registration) throw new HttpError(404, 'inscription introuvable')
  await prisma.registration.delete({ where: { id } })
}
