import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { HttpError } from '../utils/HttpError.js'

export type AuthedRequest = Request & {
  userId?: string
  userEmail?: string
}

export function authenticate(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    next(new HttpError(401, 'Authentication required'))
    return
  }
  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.sub
    req.userEmail = payload.email
    next()
  } catch {
    next(new HttpError(401, 'Invalid or expired token'))
  }
}
