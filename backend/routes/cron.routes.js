import { Router } from 'express'
import { sendEventReminders } from '../controllers/cron.controller.js'
import { requireCronSecret } from '../middlewares/requireCronSecret.middleware.js'

const router = Router()

router.get('/reminder', requireCronSecret, sendEventReminders)

export default router
