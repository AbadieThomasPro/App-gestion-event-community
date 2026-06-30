import {
  createRegistration,
  createUser,
  deleteRegistration,
  deleteUser,
  listRegistrations,
  listUsers,
  updateRegistration,
  updateUser,
} from '../services/admin.service.js'
import { HttpError } from '../utils/http-error.js'

function handleError(error, res) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message })
  }
  throw error
}

export async function getUsers(req, res) {
  res.json(await listUsers())
}

export async function postUser(req, res) {
  try {
    res.status(201).json(await createUser(req.body ?? {}))
  } catch (error) {
    handleError(error, res)
  }
}

export async function putUser(req, res) {
  try {
    res.json(await updateUser(req.params.id, req.body ?? {}, req.user.id))
  } catch (error) {
    handleError(error, res)
  }
}

export async function removeUser(req, res) {
  try {
    await deleteUser(req.params.id, req.user.id)
    res.status(204).send()
  } catch (error) {
    handleError(error, res)
  }
}

export async function getRegistrations(req, res) {
  try {
    res.json(await listRegistrations(req.query))
  } catch (error) {
    handleError(error, res)
  }
}

export async function postRegistration(req, res) {
  try {
    res.status(201).json(await createRegistration(req.body ?? {}))
  } catch (error) {
    handleError(error, res)
  }
}

export async function putRegistration(req, res) {
  try {
    res.json(await updateRegistration(req.params.id, req.body ?? {}))
  } catch (error) {
    handleError(error, res)
  }
}

export async function removeRegistration(req, res) {
  try {
    await deleteRegistration(req.params.id)
    res.status(204).send()
  } catch (error) {
    handleError(error, res)
  }
}
