import type { NextFunction, Request, Response } from 'express'
import { verifyStaffAccessToken } from '../utils/staffJwt.js'
import { HttpError } from '../utils/HttpError.js'
import type { StaffRole } from '../models/Staff.js'

export type StaffAuthedRequest = Request & {
  staffId: string
  staffEmail: string
  staffRole: StaffRole
}

export function authenticateStaff(
  req: StaffAuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    next(new HttpError(401, 'Staff authentication required'))
    return
  }
  try {
    const payload = verifyStaffAccessToken(token)
    req.staffId = payload.sub
    req.staffEmail = payload.email
    req.staffRole = payload.role
    next()
  } catch {
    next(new HttpError(401, 'Invalid or expired staff token'))
  }
}

export function requireStaffRole(...allowed: StaffRole[]) {
  return (req: StaffAuthedRequest, _res: Response, next: NextFunction) => {
    if (!allowed.includes(req.staffRole)) {
      next(new HttpError(403, 'Insufficient permissions'))
      return
    }
    next()
  }
}
