import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export type AccessPayload = { sub: string; email: string }

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.jwtSecret) as AccessPayload
  return decoded
}
