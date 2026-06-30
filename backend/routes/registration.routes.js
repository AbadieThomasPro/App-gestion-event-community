import { Router } from 'express'
import { getMyRegistrations } from '../controllers/registration.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'

const router = Router()

router.get('/me', authenticate, getMyRegistrations)

export default router
