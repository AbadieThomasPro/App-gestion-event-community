import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../utils/http-error.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    discordId: user.discordId,
    avatar: user.avatar,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function registerUser({ email, password, name }) {
  if (!email || !password || !name) {
    throw new HttpError(400, 'email, password et name sont requis')
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new HttpError(400, 'email invalide')
  }

  if (password.length < 8) {
    throw new HttpError(400, 'le mot de passe doit contenir au moins 8 caractères')
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new HttpError(409, 'un compte existe déjà avec cet email')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  return prisma.user.create({
    data: { email, password: hashedPassword, name },
    select: PUBLIC_USER_FIELDS,
  })
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, 'email et password sont requis')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new HttpError(401, 'email ou mot de passe incorrect')
  }

  const passwordMatches = await bcrypt.compare(password, user.password)
  if (!passwordMatches) {
    throw new HttpError(401, 'email ou mot de passe incorrect')
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

  return { token, user: toPublicUser(user) }
}

export async function loginAdmin({ username, password }) {
  const defaultUsername = process.env.NODE_ENV === 'production' ? null : 'admin'
  const defaultPassword = process.env.NODE_ENV === 'production' ? null : 'admin'
  const expectedUsername = process.env.ADMIN_USERNAME ?? defaultUsername
  const expectedPassword = process.env.ADMIN_PASSWORD ?? defaultPassword

  if (!expectedUsername || !expectedPassword) {
    throw new HttpError(503, 'la connexion admin temporaire n’est pas configurée')
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    throw new HttpError(401, 'identifiant ou mot de passe incorrect')
  }

  const hashedPassword = await bcrypt.hash(expectedPassword, 10)
  const user = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? 'admin@local.dev' },
    update: {
      name: 'Administrateur',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: process.env.ADMIN_EMAIL ?? 'admin@local.dev',
      name: 'Administrateur',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  })

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

  return { token, user: toPublicUser(user) }
}
