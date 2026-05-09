import bcrypt from 'bcryptjs'
import { Router, type RequestHandler } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { AnalyticsEvent } from '../models/AnalyticsEvent.js'
import { ClientMessage } from '../models/ClientMessage.js'
import { Label } from '../models/Label.js'
import { Staff } from '../models/Staff.js'
import { SupportTicket } from '../models/SupportTicket.js'
import { Referral } from '../models/Referral.js'
import { User } from '../models/User.js'
import { UserNote } from '../models/UserNote.js'
import {
  authenticateStaff,
  requireStaffRole,
  type StaffAuthedRequest,
} from '../middleware/authenticateStaff.js'
import { HttpError } from '../utils/HttpError.js'
import { getStaffDashboardSummary } from '../utils/staffDashboardSummary.js'
import { sendBulkSms } from '../services/smsService.js'
import { chatStaffRouter } from './chatStaff.js'

export const adminRouter = Router()

adminRouter.use(authenticateStaff as RequestHandler)
adminRouter.use(requireStaffRole('admin') as RequestHandler)

adminRouter.get('/dashboard/summary', async (_req, res, next) => {
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
    updatedAt: u.updatedAt,
  }
}

function referralListItem(ref: {
  _id: mongoose.Types.ObjectId
  referredUser?: unknown
  referredBy?: unknown
  referralCode: string
  status: string
  bonusGranted: boolean
  bonusAmount: number
  verifiedAt?: Date
  verifiedBy?: string
  createdAt: Date
}) {
  const ru = ref.referredUser as Record<string, unknown> | null
  const rb = ref.referredBy as Record<string, unknown> | null
  const mini = (u: Record<string, unknown> | null) => {
    if (!u || !u._id) return null
    const email = (u.email as string) || ''
    return {
      _id: (u._id as mongoose.Types.ObjectId).toString(),
      username: email.split('@')[0] || email,
      email,
      firstName: u.firstName as string | undefined,
      lastName: u.lastName as string | undefined,
      createdAt: u.createdAt as Date,
    }
  }
  return {
    _id: ref._id.toString(),
    referredUser: mini(ru),
    referredBy: rb
      ? {
          ...mini(rb)!,
          referralCode: (rb.referralCode as string) || '',
        }
      : null,
    referralCode: ref.referralCode,
    status: ref.status,
    bonusGranted: ref.bonusGranted,
    bonusAmount: ref.bonusAmount,
    verifiedAt: ref.verifiedAt,
    verifiedBy: ref.verifiedBy,
    createdAt: ref.createdAt,
  }
}

adminRouter.get('/referrals', async (req, res, next) => {
  try {
    const filterStatus =
      typeof req.query.status === 'string' ? req.query.status : undefined
    const query: Record<string, unknown> = {}
    if (filterStatus === 'pending' || filterStatus === 'verified') {
      query.status = filterStatus
    }
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
    const skip = (page - 1) * limit

    const [referrals, total] = await Promise.all([
      Referral.find(query)
        .populate('referredUser', 'email firstName lastName createdAt')
        .populate('referredBy', 'email firstName lastName referralCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Referral.countDocuments(query),
    ])

    res.json({
      success: true,
      data: referrals.map((r) => referralListItem(r as Parameters<typeof referralListItem>[0])),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (e) {
    next(e)
  }
})

adminRouter.put('/users/:id/verify-email', async (req, res, next) => {
  try {
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

adminRouter.get('/users', async (req, res, next) => {
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
        { referralCode: q.toUpperCase() },
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

adminRouter.get('/users/:id', async (req, res, next) => {
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
        .populate('staffId', 'firstName lastName email role')
        .limit(200)
        .lean(),
      Label.find({
        _id: { $in: user.crmLabelIds ?? [] },
      }).lean(),
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
        staff: n.staffId,
      })),
    })
  } catch (e) {
    next(e)
  }
})

const createAgentSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  permissions: z
    .array(z.enum(['chat', 'clients', 'support', 'referrals']))
    .optional(),
})

adminRouter.post('/agents', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const parsed = createAgentSchema.safeParse(req.body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ')
      throw new HttpError(400, msg)
    }
    const hash = await bcrypt.hash(parsed.data.password, 12)
    const agent = await Staff.create({
      email: parsed.data.email,
      password: hash,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: 'agent',
      isActive: true,
      createdBy: r.staffId,
      permissions:
        parsed.data.permissions ?? ['chat', 'clients', 'support', 'referrals'],
    })
    res.status(201).json({
      agent: {
        id: agent._id.toString(),
        email: agent.email,
        firstName: agent.firstName,
        lastName: agent.lastName,
        role: agent.role,
        permissions: agent.permissions as string[],
        createdAt: agent.createdAt,
      },
    })
  } catch (e: unknown) {
    if (
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as { code: number }).code === 11000
    ) {
      next(new HttpError(409, 'Email already in use'))
      return
    }
    next(e)
  }
})

adminRouter.get('/agents', async (_req, res, next) => {
  try {
    const agents = await Staff.find({ role: 'agent' })
      .sort({ createdAt: -1 })
      .select(
        'email firstName lastName isActive createdAt createdBy permissions',
      )
      .lean()
    res.json({
      agents: agents.map((a) => ({
        id: a._id.toString(),
        email: a.email,
        firstName: a.firstName,
        lastName: a.lastName,
        isActive: a.isActive,
        permissions: (a.permissions as string[] | undefined) ?? [
          'chat',
          'clients',
          'support',
        ],
        createdAt: a.createdAt,
      })),
    })
  } catch (e) {
    next(e)
  }
})

const patchAgentSchema = z
  .object({
    permissions: z
      .array(z.enum(['chat', 'clients', 'support', 'referrals']))
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (d) => d.permissions !== undefined || d.isActive !== undefined,
    { message: 'No updates provided' },
  )
  .refine(
    (d) => d.permissions === undefined || d.permissions.length > 0,
    { message: 'Select at least one permission' },
  )

adminRouter.patch('/agents/:id', async (req, res, next) => {
  try {
    const parsed = patchAgentSchema.safeParse(req.body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ')
      throw new HttpError(400, msg)
    }
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid agent id')
    }
    const agent = await Staff.findOne({ _id: id, role: 'agent' })
    if (!agent) throw new HttpError(404, 'Agent not found')
    if (parsed.data.permissions !== undefined) {
      agent.permissions = parsed.data.permissions
    }
    if (typeof parsed.data.isActive === 'boolean') {
      agent.isActive = parsed.data.isActive
    }
    await agent.save()
    res.json({
      agent: {
        id: agent._id.toString(),
        email: agent.email,
        firstName: agent.firstName,
        lastName: agent.lastName,
        isActive: agent.isActive,
        permissions: agent.permissions as string[],
        createdAt: agent.createdAt,
      },
    })
  } catch (e) {
    next(e)
  }
})

const ticketListQuery = z.object({
  status: z
    .enum(['open', 'pending', 'in_progress', 'resolved', 'closed', 'removed', 'all'])
    .optional()
    .default('all'),
  category: z.string().trim().max(64).optional(),
  q: z.string().trim().max(120).optional(),
})

adminRouter.get('/support/tickets', async (req, res, next) => {
  try {
    const parsed = ticketListQuery.safeParse(req.query)
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
      .limit(200)
      .populate('userId', 'firstName lastName email phoneNumber')
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
        updatedAt: t.updatedAt,
        replyCount: t.replies?.length ?? 0,
        attachmentUrl: t.attachmentUrl,
        user: t.userId,
      })),
    })
  } catch (e) {
    next(e)
  }
})

adminRouter.get('/support/tickets/:id', async (req, res, next) => {
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
        notes: ticket.notes,
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

const ticketStatusSchema = z
  .object({
    status: z
      .enum([
        'open',
        'pending',
        'in_progress',
        'resolved',
        'closed',
        'removed',
      ])
      .optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .refine((d) => d.status !== undefined || d.notes !== undefined, {
    message: 'Provide status and/or notes',
  })

adminRouter.patch('/support/tickets/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid ticket id')
    }
    const parsed = ticketStatusSchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Invalid body')
    const update: Record<string, unknown> = {}
    if (parsed.data.status !== undefined) update.status = parsed.data.status
    if (parsed.data.notes !== undefined) update.notes = parsed.data.notes
    const ticket = await SupportTicket.findByIdAndUpdate(id, update, {
      new: true,
    }).lean()
    if (!ticket) throw new HttpError(404, 'Ticket not found')
    res.json({
      ticket: {
        id: ticket._id.toString(),
        status: ticket.status,
        notes: ticket.notes,
      },
    })
  } catch (e) {
    next(e)
  }
})

const ticketReplySchema = z.object({
  message: z.string().trim().min(1).max(8000),
})

adminRouter.post('/support/tickets/:id/reply', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid ticket id')
    }
    const parsed = ticketReplySchema.safeParse(req.body)
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

const bulkSmsSchema = z.object({
  message: z.string().trim().min(1).max(1600),
  /** Send to these users by id (uses stored phone numbers). */
  userIds: z.array(z.string().min(24).max(24)).min(1).max(500),
})

adminRouter.post('/sms/bulk', async (req, res, next) => {
  try {
    const parsed = bulkSmsSchema.safeParse(req.body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ')
      throw new HttpError(400, msg)
    }
    const oids = parsed.data.userIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    )
    const users = await User.find({ _id: { $in: oids } })
      .select('phoneNumber')
      .lean()
    const phoneNumbers = users.map((u) => u.phoneNumber)
    const result = await sendBulkSms({
      message: parsed.data.message,
      phoneNumbers,
    })
    res.json({
      message: 'Bulk SMS accepted (provider stub — configure SMS in production).',
      ...result,
    })
  } catch (e) {
    next(e)
  }
})

adminRouter.get('/analytics/overview', async (req, res, next) => {
  try {
    const days = z.coerce.number().int().min(1).max(90).optional().default(7).safeParse(
      req.query.days,
    )
    if (!days.success) throw new HttpError(400, 'Invalid days')
    const since = new Date(Date.now() - days.data * 86400000)

    const [totalEvents, uniqueSessions, byPath, byType, funnel] =
      await Promise.all([
        AnalyticsEvent.countDocuments({ ts: { $gte: since } }),
        AnalyticsEvent.aggregate<{ uniqueSessions: number }>([
          { $match: { ts: { $gte: since } } },
          { $group: { _id: '$sessionId' } },
          { $count: 'uniqueSessions' },
        ]),
        AnalyticsEvent.aggregate<{ _id: string; count: number }>([
          { $match: { ts: { $gte: since }, type: 'page_view' } },
          { $group: { _id: '$path', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 30 },
        ]),
        AnalyticsEvent.aggregate<{ _id: string; count: number }>([
          { $match: { ts: { $gte: since } } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        AnalyticsEvent.aggregate<{ _id: string; count: number }>([
          {
            $match: {
              ts: { $gte: since },
              type: 'funnel_step',
              'meta.step': { $exists: true },
            },
          },
          { $group: { _id: '$meta.step', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ])

    const dropOffHints = byPath.slice(0, 15).map((p) => ({
      path: p._id || '(unknown)',
      pageViews: p.count,
    }))

    res.json({
      rangeDays: days.data,
      since: since.toISOString(),
      totalEvents,
      uniqueSessions: uniqueSessions[0]?.uniqueSessions ?? 0,
      topPaths: dropOffHints,
      eventsByType: byType.map((t) => ({ type: t._id, count: t.count })),
      funnelSteps: funnel.map((f) => ({ step: f._id, count: f.count })),
    })
  } catch (e) {
    next(e)
  }
})

/** Optional: admin visibility into agent–client message volume */
adminRouter.get('/messages/stats', async (_req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 86400000)
    const count = await ClientMessage.countDocuments({ createdAt: { $gte: since } })
    res.json({ last7DaysMessages: count })
  } catch (e) {
    next(e)
  }
})

const adminLabelSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().trim().max(32).optional().default('#FFD700'),
})

adminRouter.post('/labels', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const parsed = adminLabelSchema.safeParse(req.body)
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
      success: true,
      data: {
        _id: label._id.toString(),
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

adminRouter.get('/labels', async (_req, res, next) => {
  try {
    const labels = await Label.find().sort({ name: 1 }).lean()
    res.json({
      success: true,
      data: labels.map((l) => ({
        _id: l._id.toString(),
        name: l.name,
        color: l.color,
      })),
    })
  } catch (e) {
    next(e)
  }
})

const adminSetLabelsSchema = z.object({
  labelIds: z.array(z.string()).max(40),
})

adminRouter.patch('/users/:id/labels', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid user id')
    }
    const parsed = adminSetLabelsSchema.safeParse(req.body)
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
    res.json({ success: true, user: userPublic(user) })
  } catch (e) {
    next(e)
  }
})

const adminNoteSchema = z.object({
  body: z.string().trim().min(1).max(8000),
})

adminRouter.post('/users/:id/notes', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid user id')
    }
    const parsed = adminNoteSchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Invalid note')
    const user = await User.exists({ _id: id })
    if (!user) throw new HttpError(404, 'User not found')
    const note = await UserNote.create({
      userId: id,
      staffId: r.staffId,
      body: parsed.data.body,
    })
    res.status(201).json({
      success: true,
      data: {
        id: note._id.toString(),
        body: note.body,
        createdAt: note.createdAt,
      },
    })
  } catch (e) {
    next(e)
  }
})

adminRouter.get('/users/:id/notes', async (req, res, next) => {
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
      success: true,
      data: notes.map((n) => ({
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

adminRouter.use('/chat', chatStaffRouter)
