import { Router } from 'express'
import {
  getEvent,
  getEvents,
  postEvent,
  putEvent,
  removeEvent,
} from '../controllers/event.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { requireRole } from '../middlewares/requireRole.middleware.js'

const router = Router()
const canManageEvents = [authenticate, requireRole('ORGANIZER', 'ADMIN')]

router.get('/', getEvents)
router.get('/:id', getEvent)
router.post('/', ...canManageEvents, postEvent)
router.put('/:id', ...canManageEvents, putEvent)
router.delete('/:id', ...canManageEvents, removeEvent)

export default router
