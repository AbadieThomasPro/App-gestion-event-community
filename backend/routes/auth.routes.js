import { Router } from 'express'
import { register, login, adminLogin, me } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/admin-login', adminLogin)
router.get('/me', authenticate, me)

export default router
