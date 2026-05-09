import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'

/** Attaches `userId` when a valid member JWT is present; otherwise continues. */
export function optionalUserAuth(
  req: Request & { userId?: string },
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    next()
    return
  }
  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.sub
  } catch {
    // ignore invalid member tokens for public analytics ingest
  }
  next()
}
