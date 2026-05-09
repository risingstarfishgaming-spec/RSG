import fs from 'fs'
import { Router, type RequestHandler } from 'express'
import { z } from 'zod'
import { SupportTicket } from '../models/SupportTicket.js'
import type { AuthedRequest } from '../middleware/authenticate.js'
import { authenticate } from '../middleware/authenticate.js'
import { HttpError } from '../utils/HttpError.js'
import { supportAttachmentUpload } from '../config/supportUploads.js'
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from '../config/cloudinaryClient.js'

export const supportUserRouter = Router()

const CATEGORY_VALUES = [
  'general',
  'payment_related_queries',
  'game_issue',
  'complaint',
  'feedback',
  'business_queries',
] as const

function parseCreateBody(body: Record<string, unknown>) {
  const schema = z.object({
    subject: z.string().trim().min(3).max(200),
    body: z.string().trim().min(10).max(16_000),
    category: z.enum(CATEGORY_VALUES).optional().default('general'),
  })
  return schema.safeParse({
    subject: body.subject,
    body: body.body,
    category: body.category,
  })
}

supportUserRouter.post(
  '/tickets',
  authenticate as RequestHandler,
  supportAttachmentUpload.single('attachment'),
  async (req, res, next) => {
    try {
      const r = req as AuthedRequest
      const parsed = parseCreateBody(req.body as Record<string, unknown>)
      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join(', ')
        throw new HttpError(400, msg)
      }

      let attachmentUrl: string | undefined
      let attachmentName: string | undefined
      let attachmentType: string | undefined
      let attachmentSize: number | undefined

      const file = req.file
      if (file) {
        configureCloudinary()
        if (!isCloudinaryConfigured()) {
          fs.unlink(file.path, () => {})
          throw new HttpError(503, 'Attachments require Cloudinary configuration')
        }
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'support',
          resource_type: 'auto',
        })
        attachmentUrl = result.secure_url
        attachmentName = file.originalname
        attachmentType = file.mimetype
        attachmentSize = file.size
        fs.unlink(file.path, () => {})
      }

      const ticket = await SupportTicket.create({
        userId: r.userId,
        subject: parsed.data.subject,
        body: parsed.data.body,
        category: parsed.data.category,
        status: 'open',
        attachmentUrl,
        attachmentName,
        attachmentType,
        attachmentSize,
      })
      res.status(201).json({
        ticket: {
          id: ticket._id.toString(),
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          status: ticket.status,
          category: ticket.category,
          createdAt: ticket.createdAt,
        },
      })
    } catch (e) {
      if (req.file) fs.unlink(req.file.path, () => {})
      next(e)
    }
  },
)

supportUserRouter.get('/tickets', authenticate, async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const tickets = await SupportTicket.find({ userId: r.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    res.json({
      tickets: tickets.map((t) => ({
        id: t._id.toString(),
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        status: t.status,
        category: t.category,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        replyCount: t.replies?.length ?? 0,
        attachmentUrl: t.attachmentUrl,
      })),
    })
  } catch (e) {
    next(e)
  }
})

supportUserRouter.get('/tickets/:id', authenticate, async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const { id } = req.params
    const ticket = await SupportTicket.findOne({
      _id: id,
      userId: r.userId,
    }).lean()
    if (!ticket) throw new HttpError(404, 'Ticket not found')
    res.json({
      ticket: {
        id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        body: ticket.body,
        status: ticket.status,
        category: ticket.category,
        attachmentUrl: ticket.attachmentUrl,
        attachmentName: ticket.attachmentName,
        replies: (ticket.replies ?? []).map((rep) => ({
          id: rep._id?.toString(),
          message: rep.message,
          fromStaff: rep.fromStaff,
          staffName: rep.staffName,
          createdAt: rep.createdAt,
        })),
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
    })
  } catch (e) {
    next(e)
  }
})
