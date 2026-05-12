import type { NextFunction, Request, Response } from 'express'
import { User } from '../models/User.js'
import { verifyAccessToken } from '../utils/jwt.js'
import { HttpError } from '../utils/HttpError.js'

export type AuthedRequest = Request & {
  userId?: string
  userEmail?: string
}

/** Buffer (ms) for JWT `iat` second-precision rounding when comparing to passwordChangedAt. */
const PWD_CHANGED_IAT_SKEW_MS = 5_000

export async function authenticate(
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

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    next(new HttpError(401, 'Invalid or expired token'))
    return
  }

  try {
    // Reject tokens issued before the user's most recent password change so a
    // password reset effectively signs the user out everywhere else.
    if (payload.iat) {
      const user = await User.findById(payload.sub)
        .select('passwordChangedAt')
        .lean()
      if (!user) {
        next(new HttpError(401, 'Invalid or expired token'))
        return
      }
      const pwdChangedMs =
        user.passwordChangedAt instanceof Date
          ? user.passwordChangedAt.getTime()
          : 0
      if (pwdChangedMs && payload.iat * 1000 + PWD_CHANGED_IAT_SKEW_MS < pwdChangedMs) {
        next(
          new HttpError(
            401,
            'Your session ended after a password change. Please sign in again.',
            'SESSION_REVOKED',
          ),
        )
        return
      }
    }

    req.userId = payload.sub
    req.userEmail = payload.email
    next()
  } catch (e) {
    next(e)
  }
}
