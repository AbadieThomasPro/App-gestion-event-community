import { registerUser, loginUser, loginAdmin } from '../services/auth.service.js'
import { HttpError } from '../utils/http-error.js'

export async function register(req, res) {
  try {
    const user = await registerUser(req.body ?? {})
    res.status(201).json(user)
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message })
    }
    throw err
  }
}

export async function login(req, res) {
  try {
    const result = await loginUser(req.body ?? {})
    res.json(result)
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message })
    }
    throw err
  }
}

export async function adminLogin(req, res) {
  try {
    const result = await loginAdmin(req.body ?? {})
    res.json(result)
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message })
    }
    throw err
  }
}

export function me(req, res) {
  res.json(req.user)
}
