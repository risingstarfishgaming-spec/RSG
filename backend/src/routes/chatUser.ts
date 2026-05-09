import { Router, type RequestHandler } from 'express'
import mongoose from 'mongoose'
import { ChatMessage } from '../models/ChatMessage.js'
import { User } from '../models/User.js'
import { authenticate, type AuthedRequest } from '../middleware/authenticate.js'
import { HttpError } from '../utils/HttpError.js'
import { chatAttachmentUpload } from '../config/chatUploads.js'
import { sanitizeText } from '../utils/sanitizeText.js'
import { tryGetSocketServerInstance } from '../utils/socketManager.js'
import { storeChatAttachment } from '../utils/chatStorage.js'
import { serializeChatMessageDoc } from '../utils/chatMessageSerialize.js'

export const chatUserRouter = Router()

chatUserRouter.get('/messages', authenticate as RequestHandler, async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 25))
    const [messages, total] = await Promise.all([
      ChatMessage.find({ userId: r.userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ChatMessage.countDocuments({ userId: r.userId }),
    ])
    res.json({
      success: true,
      data: messages.map((m) =>
        serializeChatMessageDoc(m as Parameters<typeof serializeChatMessageDoc>[0]),
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (e) {
    next(e)
  }
})

chatUserRouter.post(
  '/messages',
  authenticate as RequestHandler,
  chatAttachmentUpload.single('attachment'),
  async (req, res, next) => {
    try {
      const r = req as AuthedRequest
      const user = await User.findById(r.userId).select('firstName lastName email').lean()
      if (!user) throw new HttpError(401, 'User not found')

      const { message, replyToMessageId } = req.body as {
        message?: string
        replyToMessageId?: string
      }
      const attachment = req.file

      if (!message?.trim() && !attachment) {
        throw new HttpError(400, 'Message or attachment required')
      }

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
        if (orig && orig.userId.toString() === r.userId) {
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
        attachmentUrl = await storeChatAttachment(attachment, r.userId!)
      }

      const name =
        `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
        user.email.split('@')[0]

      const chatMessage = await ChatMessage.create({
        userId: r.userId,
        senderType: 'user',
        message: message ? sanitizeText(message) : undefined,
        attachmentUrl,
        attachmentName: attachment?.originalname,
        attachmentType: attachment?.mimetype,
        attachmentSize: attachment?.size,
        status: 'unread',
        name,
        email: user.email,
        ...(replyTo ? { replyTo } : {}),
      })

      const payload = serializeChatMessageDoc(chatMessage.toObject() as Parameters<
        typeof serializeChatMessageDoc
      >[0])
      const io = tryGetSocketServerInstance()
      if (io) {
        io.to('staff').emit('chat:message:new', payload)
        io.to(`user:${r.userId}`).emit('chat:message:new', payload)
      }

      res.status(201).json({ success: true, data: payload })
    } catch (e) {
      next(e)
    }
  },
)

chatUserRouter.post(
  '/messages/:id/reactions',
  authenticate as RequestHandler,
  async (req, res, next) => {
    try {
      const r = req as AuthedRequest
      const { id } = req.params
      const { emoji } = req.body as { emoji?: string }
      if (!emoji || typeof emoji !== 'string' || emoji.length > 8) {
        throw new HttpError(400, 'Invalid emoji')
      }
      if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid id')

      const msg = await ChatMessage.findById(id)
      if (!msg) throw new HttpError(404, 'Not found')
      if (msg.userId.toString() !== r.userId) throw new HttpError(403, 'Forbidden')

      const reactorId = r.userId!
      const u = await User.findById(r.userId).select('firstName lastName email').lean()
      const reactorName =
        `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() ||
        u?.email?.split('@')[0] ||
        'User'

      const sameEmojiIdx = msg.reactions.findIndex(
        (x) => x.emoji === emoji && x.reactorId === reactorId && x.reactorType === 'user',
      )
      let action: 'added' | 'removed'
      if (sameEmojiIdx >= 0) {
        msg.reactions.splice(sameEmojiIdx, 1)
        action = 'removed'
      } else {
        const prevIdx = msg.reactions.findIndex(
          (x) => x.reactorId === reactorId && x.reactorType === 'user',
        )
        if (prevIdx >= 0) msg.reactions.splice(prevIdx, 1)
        msg.reactions.push({
          emoji,
          reactorId,
          reactorType: 'user',
          reactorName,
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
        reactorType: 'user' as const,
      }
      const io = tryGetSocketServerInstance()
      if (io) {
        io.to('staff').emit('chat:reaction:update', reactionPayload)
        io.to(`user:${msg.userId}`).emit('chat:reaction:update', reactionPayload)
        const full = serializeChatMessageDoc(msg.toObject() as Parameters<
          typeof serializeChatMessageDoc
        >[0])
        io.to('staff').emit('chat:message:updated', full)
        io.to(`user:${msg.userId}`).emit('chat:message:updated', full)
      }
      res.json({ success: true, data: reactionPayload })
    } catch (e) {
      next(e)
    }
  },
)
