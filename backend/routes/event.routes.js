import { Router } from 'express'
import {
  getEvent,
  getEvents,
  postEvent,
  putEvent,
  removeEvent,
} from '../controllers/event.controller.js'
import {
  getRegistrations,
  postRegistration,
  removeRegistration,
} from '../controllers/registration.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { requireRole } from '../middlewares/requireRole.middleware.js'

const router = Router()
const canManageEvents = [authenticate, requireRole('ORGANIZER', 'ADMIN')]

router.get('/', getEvents)
router.get('/:id', getEvent)
router.post('/', ...canManageEvents, postEvent)
router.put('/:id', ...canManageEvents, putEvent)
router.delete('/:id', ...canManageEvents, removeEvent)

router.post('/:id/register', authenticate, postRegistration)
router.delete('/:id/register', authenticate, removeRegistration)
router.get('/:id/registrations', authenticate, requireRole('ADMIN'), getRegistrations)

export default router
