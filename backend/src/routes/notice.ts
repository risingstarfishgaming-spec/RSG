import { Router, type RequestHandler } from 'express'
import { Notice } from '../models/Notice.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { authenticateStaff } from '../middleware/authenticateStaff.js'
import { getSocketServerInstance } from '../utils/socketManager.js'
import { sanitizeString, sanitizeText } from '../utils/sanitize.js'
import { HttpError } from '../utils/HttpError.js'
import { logger } from '../utils/logger.js'

export const noticeRouter = Router()

noticeRouter.get('/active', async (_req, res, next) => {
  try {
    const now = new Date()
    const notices = await Notice.find({
      isActive: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }],
    })
      .sort({ priority: 1, createdAt: -1 })
      .limit(3)
      .select('-__v')
      .lean()
    res.json({
      success: true,
      message: 'Active notices retrieved successfully',
      data: notices,
    })
  } catch (e) {
    next(e)
  }
})

noticeRouter.get(
  '/all',
  authenticateStaff as RequestHandler,
  async (_req, res, next) => {
    try {
      const notices = await Notice.find()
        .sort({ priority: 1, createdAt: -1 })
        .select('-__v')
        .lean()
      res.json({
        success: true,
        message: 'All notices retrieved successfully',
        data: notices,
      })
    } catch (e) {
      next(e)
    }
  },
)

noticeRouter.get('/:id', async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id).select('-__v').lean()
    if (!notice) throw new HttpError(404, 'Notice not found')
    res.json({
      success: true,
      message: 'Notice retrieved successfully',
      data: notice,
    })
  } catch (e) {
    next(e)
  }
})

noticeRouter.post(
  '/',
  authenticateStaff as RequestHandler,
  async (req, res, next) => {
    try {
      const { title, message, type, isActive, priority, expiresAt } = req.body
      if (!title || !message) {
        throw new HttpError(400, 'Title and message are required')
      }
      const noticePriority = priority
        ? Math.max(1, Math.min(3, parseInt(String(priority), 10)))
        : 1

      const notice = await Notice.create({
        title: sanitizeString(title),
        message: sanitizeText(message),
        type: type || 'info',
        isActive: isActive !== undefined ? isActive : true,
        priority: noticePriority,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      })

      if (isActive !== false) {
        try {
          const users = await User.find().select('_id').lean()
          const notifications = users.map((user) => ({
            userId: user._id,
            title: notice.title,
            message: notice.message,
            type: notice.type,
            noticeId: notice._id,
            isRead: false,
          }))
          if (notifications.length > 0) {
            await Notification.insertMany(notifications)
            const io = getSocketServerInstance()
            if (io) {
              io.emit('notification:new', {
                title: notice.title,
                message: notice.message,
                type: notice.type,
                noticeId: notice._id.toString(),
                createdAt: new Date().toISOString(),
              })
            }
            logger.info(
              `Created ${notifications.length} notifications for notice: ${notice.title}`,
            )
          }
        } catch (notifErr) {
          logger.error('Failed to create notifications:', notifErr)
        }
      }

      res.status(201).json({
        success: true,
        message: 'Notice created successfully',
        data: notice,
      })
    } catch (e) {
      next(e)
    }
  },
)

noticeRouter.put(
  '/:id',
  authenticateStaff as RequestHandler,
  async (req, res, next) => {
    try {
      const { title, message, type, isActive, priority, expiresAt } = req.body
      const notice = await Notice.findById(req.params.id)
      if (!notice) throw new HttpError(404, 'Notice not found')
      if (title) notice.title = sanitizeString(title)
      if (message) notice.message = sanitizeText(message)
      if (type) notice.type = type
      if (isActive !== undefined) notice.isActive = isActive
      if (priority !== undefined) {
        notice.priority = Math.max(1, Math.min(3, parseInt(String(priority), 10)))
      }
      if (expiresAt !== undefined) {
        notice.expiresAt = expiresAt ? new Date(expiresAt) : undefined
      }
      await notice.save()
      res.json({
        success: true,
        message: 'Notice updated successfully',
        data: notice,
      })
    } catch (e) {
      next(e)
    }
  },
)

noticeRouter.delete(
  '/:id',
  authenticateStaff as RequestHandler,
  async (req, res, next) => {
    try {
      const notice = await Notice.findByIdAndDelete(req.params.id)
      if (!notice) throw new HttpError(404, 'Notice not found')
      res.json({ success: true, message: 'Notice deleted successfully' })
    } catch (e) {
      next(e)
    }
  },
)
