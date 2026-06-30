import {
  findMyRegistration,
  listMyRegistrations,
  listRegistrations,
  registerForEvent,
  unregisterFromEvent,
} from '../services/registration.service.js'
import { HttpError } from '../utils/http-error.js'

function handleError(error, res) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message })
  }

  throw error
}

export async function postRegistration(req, res) {
  try {
    const registration = await registerForEvent(req.params.id, req.user.id)
    res.status(201).json(registration)
  } catch (error) {
    handleError(error, res)
  }
}

export async function removeRegistration(req, res) {
  try {
    await unregisterFromEvent(req.params.id, req.user.id)
    res.status(204).send()
  } catch (error) {
    handleError(error, res)
  }
}

export async function getRegistrations(req, res) {
  try {
    const registrations = await listRegistrations(req.params.id)
    res.json(registrations)
  } catch (error) {
    handleError(error, res)
  }
}

export async function getMyRegistration(req, res) {
  try {
    const registration = await findMyRegistration(req.params.id, req.user.id)
    res.json(registration)
  } catch (error) {
    handleError(error, res)
  }
}

export async function getMyRegistrations(req, res) {
  try {
    const registrations = await listMyRegistrations(req.user.id)
    res.json(registrations)
  } catch (error) {
    handleError(error, res)
  }
}
