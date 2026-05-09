import { Router } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { AnalyticsEvent } from '../models/AnalyticsEvent.js'
import { optionalUserAuth } from '../middleware/optionalUserAuth.js'
import { HttpError } from '../utils/HttpError.js'

export const analyticsPublicRouter = Router()

const eventSchema = z.object({
  ts: z.coerce.date().optional(),
  sessionId: z.string().trim().min(8).max(64),
  type: z.string().trim().min(1).max(64),
  path: z.string().trim().max(512).optional().default(''),
  meta: z.record(z.string(), z.any()).optional().default({}),
})

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
})

analyticsPublicRouter.post(
  '/events',
  optionalUserAuth,
  async (req, res, next) => {
    try {
      const parsed = batchSchema.safeParse(req.body)
      if (!parsed.success) {
        throw new HttpError(400, 'Invalid analytics payload')
      }
      const userId =
        (req as typeof req & { userId?: string }).userId &&
        mongoose.Types.ObjectId.isValid(
          (req as typeof req & { userId?: string }).userId!,
        )
          ? new mongoose.Types.ObjectId(
              (req as typeof req & { userId?: string }).userId,
            )
          : null

      const now = new Date()
      const docs = parsed.data.events.map((e) => ({
        ts: e.ts ?? now,
        sessionId: e.sessionId,
        type: e.type,
        path: e.path ?? '',
        userId,
        meta: e.meta ?? {},
      }))

      await AnalyticsEvent.insertMany(docs, { ordered: false })
      res.status(202).json({ accepted: docs.length })
    } catch (e) {
      next(e)
    }
  },
)
