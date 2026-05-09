import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { StaffRole } from '../models/Staff.js'

export type StaffAccessPayload = {
  sub: string
  email: string
  role: StaffRole
}

export function signStaffAccessToken(payload: StaffAccessPayload): string {
  return jwt.sign(payload, env.agentJwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions)
}

export function verifyStaffAccessToken(token: string): StaffAccessPayload {
  return jwt.verify(token, env.agentJwtSecret) as StaffAccessPayload
}
