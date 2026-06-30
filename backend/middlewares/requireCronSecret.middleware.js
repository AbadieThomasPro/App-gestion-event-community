export function requireCronSecret(req, res, next) {
  const authHeader = req.headers.authorization ?? ''

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'accès refusé' })
  }

  next()
}
