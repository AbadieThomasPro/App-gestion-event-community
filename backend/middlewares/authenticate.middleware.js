import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization ?? ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'authentification requise' })
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ message: 'token invalide ou expiré' })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
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
    },
  })

  if (!user) {
    return res.status(401).json({ message: 'utilisateur introuvable' })
  }

  req.user = user
  next()
}
