import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../utils/HttpError.js'
import { logger } from '../utils/logger.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  logger.error(err)
  const message = err instanceof Error ? err.message : 'Internal server error'
  const status =
    err instanceof HttpError
      ? err.statusCode
      : (err as { status?: number }).status ?? 500
  const body: { error: string; code?: string } = { error: message }
  if (err instanceof HttpError && err.clientCode) {
    body.code = err.clientCode
  }
  res.status(status).json(body)
}
