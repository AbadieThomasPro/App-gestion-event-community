import { Router } from 'express'
import {
  getRegistrations,
  getUsers,
  postRegistration,
  postUser,
  putRegistration,
  putUser,
  removeRegistration,
  removeUser,
} from '../controllers/admin.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { requireRole } from '../middlewares/requireRole.middleware.js'

const router = Router()

router.use(authenticate, requireRole('ADMIN'))

router.get('/users', getUsers)
router.post('/users', postUser)
router.put('/users/:id', putUser)
router.delete('/users/:id', removeUser)

router.get('/registrations', getRegistrations)
router.post('/registrations', postRegistration)
router.put('/registrations/:id', putRegistration)
router.delete('/registrations/:id', removeRegistration)

export default router
