import {
  createEvent,
  deleteEvent,
  findEvent,
  listEvents,
  updateEvent,
} from '../services/event.service.js'
import { HttpError } from '../utils/http-error.js'

function handleError(error, res) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message })
  }

  throw error
}

export async function getEvents(req, res) {
  const events = await listEvents()
  res.json(events)
}

export async function getEvent(req, res) {
  try {
    const event = await findEvent(req.params.id)
    res.json(event)
  } catch (error) {
    handleError(error, res)
  }
}

export async function postEvent(req, res) {
  try {
    const event = await createEvent(req.body ?? {}, req.user.id)
    res.status(201).json(event)
  } catch (error) {
    handleError(error, res)
  }
}

export async function putEvent(req, res) {
  try {
    const event = await updateEvent(req.params.id, req.body ?? {})
    res.json(event)
  } catch (error) {
    handleError(error, res)
  }
}

export async function removeEvent(req, res) {
  try {
    await deleteEvent(req.params.id)
    res.status(204).send()
  } catch (error) {
    handleError(error, res)
  }
}
