import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export type AccessPayload = { sub: string; email: string }

/** AccessPayload after decoding — `iat` is set automatically by jsonwebtoken. */
export type DecodedAccessPayload = AccessPayload & {
  iat?: number
  exp?: number
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): DecodedAccessPayload {
  const decoded = jwt.verify(token, env.jwtSecret) as DecodedAccessPayload
  return decoded
}
