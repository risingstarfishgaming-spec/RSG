import { Router } from 'express'
import mongoose from 'mongoose'
import { ChatMessage } from '../models/ChatMessage.js'
import { Staff } from '../models/Staff.js'
import { User } from '../models/User.js'
import { type StaffAuthedRequest } from '../middleware/authenticateStaff.js'
import { HttpError } from '../utils/HttpError.js'
import { chatAttachmentUpload } from '../config/chatUploads.js'
import { sanitizeText } from '../utils/sanitizeText.js'
import { tryGetSocketServerInstance } from '../utils/socketManager.js'
import { storeChatAttachment } from '../utils/chatStorage.js'
import { serializeChatMessageDoc } from '../utils/chatMessageSerialize.js'

export { serializeChatMessageDoc } from '../utils/chatMessageSerialize.js'

export const chatStaffRouter = Router()

type ChatStatus = 'unread' | 'read' | 'resolved'

function buildSearchFilter(search?: string) {
  if (!search?.trim()) return undefined
  const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  return {
    $or: [{ name: regex }, { email: regex }, { message: regex }],
  }
}

function emitMessageStatus(io: NonNullable<ReturnType<typeof tryGetSocketServerInstance>>, doc: mongoose.Document) {
  const payload = serializeChatMessageDoc(doc.toObject() as Parameters<typeof serializeChatMessageDoc>[0])
  io.to('staff').emit('chat:message:status', payload)
  io.to(`user:${payload.userId}`).emit('chat:message:status', payload)
}

chatStaffRouter.get('/conversations', async (req, res, next) => {
  try {
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined
    const search =
      typeof req.query.search === 'string' ? req.query.search : undefined

    const match: Record<string, unknown> = {}
    if (status) match.status = status
    const searchFilter = buildSearchFilter(search)
    const preMatch = searchFilter ? { $and: [match, searchFilter] } : match

    const pipeline: mongoose.PipelineStage[] = []
    if (Object.keys(preMatch).length > 0) {
      pipeline.push({ $match: preMatch })
    }
    pipeline.push(
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$senderType', 'user'] },
                    { $eq: ['$status', 'unread'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'labels',
          localField: 'user.crmLabelIds',
          foreignField: '_id',
          as: 'userLabels',
        },
      },
      {
        $project: {
          userId: { $toString: '$_id' },
          unreadCount: 1,
          lastMessage: {
            id: { $toString: '$lastMessage._id' },
            userId: { $toString: '$lastMessage.userId' },
            staffId: {
              $cond: [
                { $ne: ['$lastMessage.staffId', null] },
                { $toString: '$lastMessage.staffId' },
                '$$REMOVE',
              ],
            },
            senderType: '$lastMessage.senderType',
            message: '$lastMessage.message',
            attachmentUrl: '$lastMessage.attachmentUrl',
            attachmentName: '$lastMessage.attachmentName',
            attachmentType: '$lastMessage.attachmentType',
            attachmentSize: '$lastMessage.attachmentSize',
            status: '$lastMessage.status',
            name: '$lastMessage.name',
            email: '$lastMessage.email',
            createdAt: '$lastMessage.createdAt',
            updatedAt: '$lastMessage.updatedAt',
            metadata: '$lastMessage.metadata',
            replyTo: '$lastMessage.replyTo',
            reactions: '$lastMessage.reactions',
          },
          userInfo: {
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            email: '$user.email',
          },
          labels: {
            $map: {
              input: '$userLabels',
              as: 'lbl',
              in: {
                _id: { $toString: '$$lbl._id' },
                name: '$$lbl.name',
                color: '$$lbl.color',
              },
            },
          },
        },
      },
      {
        $addFields: {
          name: {
            $let: {
              vars: {
                full: {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ['$userInfo.firstName', ''] },
                        ' ',
                        { $ifNull: ['$userInfo.lastName', ''] },
                      ],
                    },
                  },
                },
              },
              in: {
                $cond: {
                  if: { $gt: [{ $strLenCP: '$$full' }, 0] },
                  then: '$$full',
                  else: {
                    $ifNull: [
                      { $arrayElemAt: [{ $split: ['$userInfo.email', '@'] }, 0] },
                      'User',
                    ],
                  },
                },
              },
            },
          },
          email: { $ifNull: ['$userInfo.email', ''] },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    )

    const rows = await ChatMessage.aggregate(pipeline)
    const data = rows.map((c) => {
      const lastMessage = c.lastMessage as Record<string, unknown> | undefined
      let displayName = (c.name as string) || 'User'
      if (
        lastMessage?.senderType === 'admin' &&
        lastMessage.metadata &&
        typeof lastMessage.metadata === 'object' &&
        lastMessage.metadata !== null &&
        'recipientName' in lastMessage.metadata &&
        typeof (lastMessage.metadata as { recipientName?: string }).recipientName ===
          'string'
      ) {
        displayName = (lastMessage.metadata as { recipientName: string }).recipientName
      }
      return {
        userId: c.userId as string,
        name: displayName,
        email: (c.email as string) || '',
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCount as number,
        labels: (c.labels as unknown[]) || [],
      }
    })

    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
})

chatStaffRouter.get('/messages', async (req, res, next) => {
  try {
    const userId = req.query.userId
    if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(400, 'userId required')
    }
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50))
    const before = req.query.before
    const page = Math.max(1, Number(req.query.page) || 1)
    const filter: Record<string, unknown> = { userId }
    if (typeof before === 'string' && before) {
      const d = new Date(before)
      if (!Number.isNaN(d.getTime())) filter.createdAt = { $lt: d }
    }

    const useCursor = typeof before === 'string' && before.length > 0
    const sortOrder = useCursor
      ? ({ createdAt: 1 } as const)
      : ({ createdAt: -1 } as const)

    const total = await ChatMessage.countDocuments({ userId })

    let q = ChatMessage.find(filter).sort(sortOrder)
    if (useCursor) {
      q = q.limit(limit)
    } else {
      q = q.skip((page - 1) * limit).limit(limit)
    }
    const messages = await q.lean()
    const normalized =
      sortOrder.createdAt === 1 ? messages : [...messages].reverse()

    let userInfo: {
      id: string
      name: string
      firstName: string
      lastName: string
      email: string
    } | null = null
    const u = await User.findById(userId)
      .select('firstName lastName email')
      .lean()
    if (u) {
      const displayName =
        `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() ||
        u.email?.split('@')[0] ||
        'User'
      userInfo = {
        id: u._id.toString(),
        name: displayName,
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        email: u.email ?? '',
      }
    }

    res.json({
      success: true,
      data: normalized.map((m) =>
        serializeChatMessageDoc(m as Parameters<typeof serializeChatMessageDoc>[0]),
      ),
      user: userInfo,
      pagination: {
        total,
        page: useCursor ? 1 : page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (e) {
    next(e)
  }
})

chatStaffRouter.post(
  '/messages',
  chatAttachmentUpload.single('attachment'),
  async (req, res, next) => {
    try {
      const r = req as unknown as StaffAuthedRequest
      const { userId, message, replyToMessageId } = req.body as {
        userId?: string
        message?: string
        replyToMessageId?: string
      }
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new HttpError(400, 'userId required')
      }
      const attachment = req.file
      if (!message?.trim() && !attachment) {
        throw new HttpError(400, 'Message or attachment required')
      }

      const staff = await Staff.findById(r.staffId).select('firstName lastName email').lean()
      const staffName = staff
        ? `${staff.firstName} ${staff.lastName}`.trim()
        : 'Staff'

      const member = await User.findById(userId).select('firstName lastName email').lean()
      const recipientName =
        `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim() ||
        member?.email?.split('@')[0] ||
        'User'

      let replyTo: {
        messageId: mongoose.Types.ObjectId
        message?: string
        senderName?: string
        senderType?: string
      } | undefined

      if (
        replyToMessageId &&
        mongoose.Types.ObjectId.isValid(replyToMessageId)
      ) {
        const orig = await ChatMessage.findById(replyToMessageId).lean()
        if (orig && orig.userId.toString() === userId) {
          replyTo = {
            messageId: orig._id,
            message: orig.message?.slice(0, 500),
            senderName: orig.name ?? undefined,
            senderType: orig.senderType ?? undefined,
          }
        }
      }

      let attachmentUrl: string | undefined
      if (attachment) {
        attachmentUrl = await storeChatAttachment(attachment, userId)
      }

      const chatMessage = await ChatMessage.create({
        userId,
        staffId: r.staffId,
        senderType: 'admin',
        message: message ? sanitizeText(message) : undefined,
        attachmentUrl,
        attachmentName: attachment?.originalname,
        attachmentType: attachment?.mimetype,
        attachmentSize: attachment?.size,
        status: 'sent',
        name: staffName,
        email: member?.email,
        ...(replyTo ? { replyTo } : {}),
        metadata: {
          recipientName,
          ...(attachment ? { attachmentUploadedBy: staffName } : {}),
          staffDisplayName: staffName,
        },
      })

      const unreadBefore = await ChatMessage.find({
        userId,
        senderType: 'user',
        status: 'unread',
      }).select('_id')
      const unreadIds = unreadBefore.map((x) => x._id)
      if (unreadIds.length > 0) {
        await ChatMessage.updateMany(
          { _id: { $in: unreadIds } },
          { status: 'read', readAt: new Date() },
        )
      }

      const io = tryGetSocketServerInstance()
      if (io && unreadIds.length > 0) {
        const readDocs = await ChatMessage.find({ _id: { $in: unreadIds } })
        for (const d of readDocs) {
          emitMessageStatus(io, d)
        }
      }

      const payload = serializeChatMessageDoc(chatMessage.toObject() as Parameters<
        typeof serializeChatMessageDoc
      >[0])
      if (io) {
        io.to('staff').emit('chat:message:new', payload)
        io.to(`user:${userId}`).emit('chat:message:new', payload)
      }

      res.status(201).json({ success: true, data: payload })
    } catch (e) {
      next(e)
    }
  },
)

chatStaffRouter.post('/mark-read', async (req, res, next) => {
  try {
    const { userId } = req.body as { userId?: string }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(400, 'userId required')
    }
    const unread = await ChatMessage.find({
      userId,
      senderType: 'user',
      status: 'unread',
    })
    const io = tryGetSocketServerInstance()
    for (const m of unread) {
      m.status = 'read'
      m.readAt = new Date()
      await m.save()
      if (io) emitMessageStatus(io, m)
    }
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
})

chatStaffRouter.put('/messages/batch-status', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const { messageIds, status, userId } = req.body as {
      messageIds?: string[]
      status?: ChatStatus
      userId?: string
    }
    if (!status || !['unread', 'read', 'resolved'].includes(status)) {
      throw new HttpError(400, 'Invalid status')
    }

    const staff = await Staff.findById(r.staffId).select('firstName lastName').lean()
    const staffName = staff
      ? `${staff.firstName} ${staff.lastName}`.trim()
      : 'Staff'

    const filter: mongoose.FilterQuery<typeof ChatMessage> = {}
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      const valid = messageIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
      if (valid.length === 0) throw new HttpError(400, 'No valid message IDs')
      filter._id = { $in: valid.map((id) => new mongoose.Types.ObjectId(id)) }
    } else if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId
      filter.senderType = 'user'
      filter.status = 'unread'
    } else {
      throw new HttpError(400, 'messageIds or userId required')
    }

    const docs = await ChatMessage.find(filter)
    const io = tryGetSocketServerInstance()
    let modified = 0
    for (const m of docs) {
      m.status = status
      if (status === 'read') m.readAt = new Date()
      if (status === 'resolved') {
        m.resolvedAt = new Date()
        const meta =
          typeof m.metadata === 'object' && m.metadata !== null
            ? { ...(m.metadata as Record<string, unknown>) }
            : {}
        meta.resolvedByStaff = staffName
        meta.resolvedAt = m.resolvedAt
        m.metadata = meta
      }
      await m.save()
      modified++
      if (io) emitMessageStatus(io, m)
    }

    res.json({
      success: true,
      message: `Updated ${modified} message(s)`,
      data: { modifiedCount: modified },
    })
  } catch (e) {
    next(e)
  }
})

chatStaffRouter.put('/messages/:id/status', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const { id } = req.params
    const { status } = req.body as { status?: ChatStatus }
    if (!status || !['unread', 'read', 'resolved'].includes(status)) {
      throw new HttpError(400, 'Invalid status')
    }
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid id')

    const staff = await Staff.findById(r.staffId).select('firstName lastName').lean()
    const staffName = staff
      ? `${staff.firstName} ${staff.lastName}`.trim()
      : 'Staff'

    const m = await ChatMessage.findById(id)
    if (!m) throw new HttpError(404, 'Not found')

    m.status = status
    if (status === 'read') m.readAt = new Date()
    if (status === 'resolved') {
      m.resolvedAt = new Date()
      const meta =
        typeof m.metadata === 'object' && m.metadata !== null
          ? { ...(m.metadata as Record<string, unknown>) }
          : {}
      meta.resolvedByStaff = staffName
      meta.resolvedAt = m.resolvedAt
      m.metadata = meta
    }
    await m.save()

    const io = tryGetSocketServerInstance()
    if (io) emitMessageStatus(io, m)

    const payload = serializeChatMessageDoc(m.toObject() as Parameters<
      typeof serializeChatMessageDoc
    >[0])
    res.json({ success: true, data: payload })
  } catch (e) {
    next(e)
  }
})

chatStaffRouter.post('/messages/:id/reactions', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    const { id } = req.params
    const { emoji } = req.body as { emoji?: string }
    if (!emoji || typeof emoji !== 'string' || emoji.length > 8) {
      throw new HttpError(400, 'Invalid emoji')
    }
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid id')

    const msg = await ChatMessage.findById(id)
    if (!msg) throw new HttpError(404, 'Not found')

    const staff = await Staff.findById(r.staffId).select('firstName lastName').lean()
    const staffName = staff
      ? `${staff.firstName} ${staff.lastName}`.trim()
      : 'Staff'

    const reactorId = r.staffId
    const sameEmojiIdx = msg.reactions.findIndex(
      (x) => x.emoji === emoji && x.reactorId === reactorId && x.reactorType === 'admin',
    )
    let action: 'added' | 'removed'
    if (sameEmojiIdx >= 0) {
      msg.reactions.splice(sameEmojiIdx, 1)
      action = 'removed'
    } else {
      const prevIdx = msg.reactions.findIndex(
        (x) => x.reactorId === reactorId && x.reactorType === 'admin',
      )
      if (prevIdx >= 0) msg.reactions.splice(prevIdx, 1)
      msg.reactions.push({
        emoji,
        reactorId,
        reactorType: 'admin',
        reactorName: staffName,
        createdAt: new Date(),
      })
      action = 'added'
    }
    await msg.save()

    const reactionPayload = {
      messageId: id,
      userId: msg.userId.toString(),
      reactions: msg.reactions,
      action,
      emoji,
      reactorId,
      reactorType: 'admin' as const,
    }
    const io = tryGetSocketServerInstance()
    if (io) {
      io.to('staff').emit('chat:reaction:update', reactionPayload)
      io.to(`user:${msg.userId.toString()}`).emit('chat:reaction:update', reactionPayload)
      const full = serializeChatMessageDoc(msg.toObject() as Parameters<
        typeof serializeChatMessageDoc
      >[0])
      io.to('staff').emit('chat:message:updated', full)
      io.to(`user:${msg.userId.toString()}`).emit('chat:message:updated', full)
    }
    res.json({ success: true, data: reactionPayload })
  } catch (e) {
    next(e)
  }
})
