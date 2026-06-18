import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'

const router = Router()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body ?? {}

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'email, password et name sont requis' })
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'email invalide' })
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'le mot de passe doit contenir au moins 8 caractères' })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return res.status(409).json({ message: 'un compte existe déjà avec cet email' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
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

  res.status(201).json(user)
})

export default router
