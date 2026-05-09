import { Router, type RequestHandler } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { ClientMessage } from '../models/ClientMessage.js'
import { Label } from '../models/Label.js'
import { Staff } from '../models/Staff.js'
import { SupportTicket } from '../models/SupportTicket.js'
import { User } from '../models/User.js'
import { UserNote } from '../models/UserNote.js'
import {
  authenticateStaff,
  requireStaffRole,
  type StaffAuthedRequest,
} from '../middleware/authenticateStaff.js'
import { HttpError } from '../utils/HttpError.js'
import { getStaffDashboardSummary } from '../utils/staffDashboardSummary.js'
import { agentReferralsRouter } from './agentReferrals.js'
import { chatStaffRouter } from './chatStaff.js'

export const agentRouter = Router()

agentRouter.use(authenticateStaff as RequestHandler)
agentRouter.use(requireStaffRole('agent') as RequestHandler)

agentRouter.get('/dashboard/summary', async (_req, res, next) => {
  try {
    const data = await getStaffDashboardSummary()
    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
})

const pagination = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  q: z.string().trim().max(120).optional(),
})

function referredBySummary(u: Record<string, unknown>) {
  const rb = u.referredBy as
    | Record<string, unknown>
    | mongoose.Types.ObjectId
    | null
    | undefined
  if (!rb) return null
  if (typeof rb === 'object' && rb !== null && '_id' in rb) {
    const o = rb as Record<string, unknown>
    return {
      id: (o._id as mongoose.Types.ObjectId).toString(),
      email: (o.email as string) || '',
      referralCode: ((o.referralCode as string) || '').toUpperCase(),
    }
  }
  if (rb instanceof mongoose.Types.ObjectId) {
    return { id: rb.toString(), email: '', referralCode: '' }
  }
  return null
}

function userPublic(u: Record<string, unknown>) {
  return {
    id: (u._id as mongoose.Types.ObjectId).toString(),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    isEmailVerified: u.isEmailVerified,
    referralCode: u.referralCode,
    referredBy: referredBySummary(u),
    crmLabelIds: (u.crmLabelIds as mongoose.Types.ObjectId[] | undefined)?.map(
      (id) => id.toString(),
    ),
    createdAt: u.createdAt,
  }
}

agentRouter.get('/users', async (req, res, next) => {
  try {
    const parsed = pagination.safeParse(req.query)
    if (!parsed.success) throw new HttpError(400, 'Invalid query')
    const { page, limit, q } = parsed.data
    const filter: Record<string, unknown> = {}
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [
        { email: rx },
        { firstName: rx },
        { lastName: rx },
        { phoneNumber: rx },
      ]
    }
    const [total, rows] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .populate('referredBy', 'email referralCode')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ])
    res.json({
      total,
      page,
      limit,
      users: rows.map(userPublic),
    })
  } catch (e) {
    next(e)
  }
})

async function ensureClientsPermission(r: StaffAuthedRequest) {
  const staff = await Staff.findById(r.staffId).select('permissions').lean()
  if (!staff) throw new HttpError(401, 'Staff not found')
  const perms = staff.permissions as string[] | undefined
  if (perms?.length && !perms.includes('clients')) {
    throw new HttpError(403, 'Clients permission required')
  }
}

agentRouter.put('/users/:id/verify-email', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    await ensureClientsPermission(r)
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid user id')
    }
    const updated = await User.findByIdAndUpdate(
      id,
      {
        $set: { isEmailVerified: true },
        $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
      },
      { new: true },
    ).lean()
    if (!updated) throw new HttpError(404, 'User not found')
    res.json({ success: true, user: userPublic(updated) })
  } catch (e) {
    next(e)
  }
})

agentRouter.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid user id')
    }
    const user = await User.findById(id)
      .populate('referredBy', 'email referralCode')
      .lean()
    if (!user) throw new HttpError(404, 'User not found')
    const [notes, labels] = await Promise.all([
      UserNote.find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Label.find({ _id: { $in: user.crmLabelIds ?? [] } }).lean(),
    ])
    res.json({
      user: userPublic(user),
      labels: labels.map((l) => ({
        id: l._id.toString(),
        name: l.name,
        color: l.color,
      })),
      notes: notes.map((n) => ({
        id: n._id.toString(),
        body: n.body,
        createdAt: n.createdAt,
        staffId: n.staffId.toString(),
      })),
    })
  } catch (e) {
    next(e)
  }
})

const labelSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().trim().max(32).optional().default('#FFD700'),
})

agentRouter.post('/labels', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const parsed = labelSchema.safeParse(req.body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ')
      throw new HttpError(400, msg)
    }
    const label = await Label.create({
      name: parsed.data.name,
      color: parsed.data.color,
      createdBy: r.staffId,
    })
    res.status(201).json({
      label: {
        id: label._id.toString(),
        name: label.name,
        color: label.color,
      },
    })
  } catch (e: unknown) {
    if (
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as { code: number }).code === 11000
    ) {
      next(new HttpError(409, 'A label with this name already exists'))
      return
    }
    next(e)
  }
})

agentRouter.get('/labels', async (_req, res, next) => {
  try {
    const labels = await Label.find().sort({ name: 1 }).lean()
    res.json({
      labels: labels.map((l) => ({
        id: l._id.toString(),
        name: l.name,
        color: l.color,
      })),
    })
  } catch (e) {
    next(e)
  }
})

const setLabelsSchema = z.object({
  labelIds: z.array(z.string()).max(40),
})

agentRouter.patch('/users/:id/labels', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid user id')
    }
    const parsed = setLabelsSchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Invalid body')
    const ids = parsed.data.labelIds.filter((x) => mongoose.Types.ObjectId.isValid(x))
    const existing = await Label.countDocuments({ _id: { $in: ids } })
    if (existing !== ids.length) {
      throw new HttpError(400, 'One or more label ids are invalid')
    }
    const user = await User.findByIdAndUpdate(
      id,
      {
        crmLabelIds: ids.map((i) => new mongoose.Types.ObjectId(i)),
      },
      { new: true },
    ).lean()
    if (!user) throw new HttpError(404, 'User not found')
    res.json({ user: userPublic(user) })
  } catch (e) {
    next(e)
  }
})

const noteSchema = z.object({
  body: z.string().trim().min(1).max(8000),
})

agentRouter.post('/users/:id/notes', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid user id')
    }
    const parsed = noteSchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Invalid note')
    const user = await User.exists({ _id: id })
    if (!user) throw new HttpError(404, 'User not found')
    const note = await UserNote.create({
      userId: id,
      staffId: r.staffId,
      body: parsed.data.body,
    })
    res.status(201).json({
      note: {
        id: note._id.toString(),
        body: note.body,
        createdAt: note.createdAt,
        staffId: note.staffId.toString(),
      },
    })
  } catch (e) {
    next(e)
  }
})

agentRouter.get('/users/:id/notes', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid user id')
    }
    const notes = await UserNote.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    res.json({
      notes: notes.map((n) => ({
        id: n._id.toString(),
        body: n.body,
        createdAt: n.createdAt,
        staffId: n.staffId.toString(),
      })),
    })
  } catch (e) {
    next(e)
  }
})

const messageSchema = z.object({
  body: z.string().trim().min(1).max(8000),
})

agentRouter.post('/users/:id/messages', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid user id')
    }
    const parsed = messageSchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Invalid message')
    const user = await User.exists({ _id: id })
    if (!user) throw new HttpError(404, 'User not found')
    const msg = await ClientMessage.create({
      userId: id,
      staffId: r.staffId,
      direction: 'agent_to_user',
      body: parsed.data.body,
    })
    res.status(201).json({
      message: {
        id: msg._id.toString(),
        body: msg.body,
        createdAt: msg.createdAt,
        direction: msg.direction,
      },
    })
  } catch (e) {
    next(e)
  }
})

agentRouter.get('/users/:id/messages', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid user id')
    }
    const rows = await ClientMessage.find({ userId: id, staffId: r.staffId })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean()
    res.json({
      messages: rows.map((m) => ({
        id: m._id.toString(),
        body: m.body,
        direction: m.direction,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
    })
  } catch (e) {
    next(e)
  }
})

const agentTicketListQuery = z.object({
  status: z
    .enum(['open', 'pending', 'in_progress', 'resolved', 'closed', 'removed', 'all'])
    .optional()
    .default('all'),
  category: z.string().trim().max(64).optional(),
  q: z.string().trim().max(120).optional(),
})

agentRouter.get('/support/tickets', async (req, res, next) => {
  try {
    const parsed = agentTicketListQuery.safeParse(req.query)
    if (!parsed.success) throw new HttpError(400, 'Invalid query')
    const filter: Record<string, unknown> = {}
    if (parsed.data.status !== 'all') filter.status = parsed.data.status
    if (parsed.data.category) filter.category = parsed.data.category
    if (parsed.data.q) {
      const rx = new RegExp(
        parsed.data.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      )
      filter.$or = [{ subject: rx }, { body: rx }, { ticketNumber: rx }]
    }
    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'firstName lastName email')
      .lean()
    res.json({
      tickets: tickets.map((t) => ({
        id: t._id.toString(),
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        body: t.body,
        status: t.status,
        category: t.category,
        createdAt: t.createdAt,
        replyCount: t.replies?.length ?? 0,
        attachmentUrl: t.attachmentUrl,
        user: t.userId,
      })),
    })
  } catch (e) {
    next(e)
  }
})

agentRouter.get('/support/tickets/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid ticket id')
    }
    const ticket = await SupportTicket.findById(id)
      .populate('userId', 'firstName lastName email phoneNumber')
      .lean()
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
        user: ticket.userId,
      },
    })
  } catch (e) {
    next(e)
  }
})

const agentTicketStatusSchema = z.object({
  status: z.enum([
    'open',
    'pending',
    'in_progress',
    'resolved',
    'closed',
  ]),
})

agentRouter.patch('/support/tickets/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid ticket id')
    }
    const parsed = agentTicketStatusSchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Invalid body')
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status: parsed.data.status },
      { new: true },
    ).lean()
    if (!ticket) throw new HttpError(404, 'Ticket not found')
    res.json({ ticket: { id: ticket._id.toString(), status: ticket.status } })
  } catch (e) {
    next(e)
  }
})

const agentTicketReplySchema = z.object({
  message: z.string().trim().min(1).max(8000),
})

agentRouter.post('/support/tickets/:id/reply', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid ticket id')
    }
    const parsed = agentTicketReplySchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Invalid body')
    const staff = await Staff.findById(r.staffId)
      .select('firstName lastName')
      .lean()
    const staffName = staff
      ? `${staff.firstName} ${staff.lastName}`.trim()
      : 'Staff'
    const ticket = await SupportTicket.findById(id)
    if (!ticket) throw new HttpError(404, 'Ticket not found')
    ticket.replies.push({
      message: parsed.data.message,
      fromStaff: true,
      staffName,
      createdAt: new Date(),
    })
    if (ticket.status === 'open' || ticket.status === 'pending') {
      ticket.status = 'in_progress'
    }
    await ticket.save()
    res.status(201).json({
      reply: ticket.replies[ticket.replies.length - 1],
    })
  } catch (e) {
    next(e)
  }
})

agentRouter.use('/referrals', agentReferralsRouter)
agentRouter.use('/chat', chatStaffRouter)
