import { Router, type RequestHandler } from 'express'
import type { AuthedRequest } from '../middleware/authenticate.js'
import { authenticate } from '../middleware/authenticate.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { HttpError } from '../utils/HttpError.js'

export const notificationUserRouter = Router()

notificationUserRouter.use(authenticate as RequestHandler)

notificationUserRouter.get('/', async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const userId = r.userId!
    const page = Number(req.query.page) || 1
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const unreadOnly = req.query.unreadOnly === 'true'

    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const user = await User.findById(userId).select('createdAt').lean()
    const userCreatedAt = user?.createdAt ?? new Date()
    const minDate = new Date(
      Math.max(twentyFourHoursAgo.getTime(), userCreatedAt.getTime()),
    )

    const query: Record<string, unknown> = {
      userId,
      createdAt: { $gte: minDate },
    }
    if (unreadOnly) query.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId, createdAt: { $gte: minDate } }),
      Notification.countDocuments({
        userId,
        isRead: false,
        createdAt: { $gte: minDate },
      }),
    ])

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (e) {
    next(e)
  }
})

notificationUserRouter.get('/unread-count', async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const userId = r.userId!
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
    const user = await User.findById(userId).select('createdAt').lean()
    const userCreatedAt = user?.createdAt ?? new Date()
    const minDate = new Date(
      Math.max(twentyFourHoursAgo.getTime(), userCreatedAt.getTime()),
    )
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
      createdAt: { $gte: minDate },
    })
    res.json({ success: true, count })
  } catch (e) {
    next(e)
  }
})

notificationUserRouter.put('/:id/read', async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: r.userId,
    })
    if (!notification) throw new HttpError(404, 'Notification not found')
    notification.isRead = true
    notification.readAt = new Date()
    await notification.save()
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    })
  } catch (e) {
    next(e)
  }
})

notificationUserRouter.put('/read-all', async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const userId = r.userId!
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
    const user = await User.findById(userId).select('createdAt').lean()
    const userCreatedAt = user?.createdAt ?? new Date()
    const minDate = new Date(
      Math.max(twentyFourHoursAgo.getTime(), userCreatedAt.getTime()),
    )
    const result = await Notification.updateMany(
      { userId, isRead: false, createdAt: { $gte: minDate } },
      { isRead: true, readAt: new Date() },
    )
    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount },
    })
  } catch (e) {
    next(e)
  }
})

notificationUserRouter.delete('/:id', async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: r.userId,
    })
    if (!notification) throw new HttpError(404, 'Notification not found')
    res.json({ success: true, message: 'Notification deleted' })
  } catch (e) {
    next(e)
  }
})
