import fs from 'fs'
import { Router, type RequestHandler } from 'express'
import mongoose from 'mongoose'
import { Bonus } from '../models/Bonus.js'
import { ChatMessage } from '../models/ChatMessage.js'
import { User } from '../models/User.js'
import {
  authenticateStaff,
  requireStaffRole,
} from '../middleware/authenticateStaff.js'
import { authenticate, type AuthedRequest } from '../middleware/authenticate.js'
import { HttpError } from '../utils/HttpError.js'
import { bonusImageUpload } from '../config/cmsUploads.js'
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from '../config/cloudinaryClient.js'
import { tryGetSocketServerInstance } from '../utils/socketManager.js'
import { serializeChatMessageDoc } from '../utils/chatMessageSerialize.js'

export const bonusRouter = Router()

const BONUS_TYPES = new Set([
  'welcome',
  'deposit',
  'free_spins',
  'cashback',
  'other',
])

bonusRouter.get('/', async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const bonuses = await Bonus.find({
      isActive: true,
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: null },
        { validUntil: { $gte: thirtyDaysAgo } },
      ],
    })
      .sort({ order: 1, createdAt: -1 })
      .select('-__v')
      .lean()
    res.json({ success: true, data: bonuses })
  } catch (e) {
    next(e)
  }
})

const adminOnly: RequestHandler[] = [
  authenticateStaff as RequestHandler,
  requireStaffRole('admin') as RequestHandler,
]

bonusRouter.get('/all', ...adminOnly, async (_req, res, next) => {
  try {
    const bonuses = await Bonus.find()
      .sort({ order: 1, createdAt: -1 })
      .select('-__v')
      .lean()
    res.json({ success: true, data: bonuses })
  } catch (e) {
    next(e)
  }
})

bonusRouter.post(
  '/upload-image',
  ...adminOnly,
  bonusImageUpload.single('image'),
  async (req, res, next) => {
    try {
      const file = req.file
      if (!file) {
        throw new HttpError(400, 'No image file provided')
      }
      configureCloudinary()
      let imageUrl: string
      if (isCloudinaryConfigured()) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'bonuses',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        })
        imageUrl = result.secure_url
        fs.unlink(file.path, () => {})
      } else {
        throw new HttpError(503, 'Image upload requires Cloudinary configuration')
      }
      res.json({ success: true, data: { url: imageUrl } })
    } catch (e) {
      if (req.file) fs.unlink(req.file.path, () => {})
      next(e)
    }
  },
)

bonusRouter.post('/', ...adminOnly, async (req, res, next) => {
  try {
    const {
      title,
      description,
      image,
      bonusType,
      bonusValue,
      termsAndConditions,
      order,
      isActive,
      validFrom,
      validUntil,
      maxClaims,
      cooldownHours,
    } = req.body ?? {}
    if (!title || !description || !image) {
      throw new HttpError(400, 'Title, description, and image are required')
    }
    if (bonusType && !BONUS_TYPES.has(bonusType)) {
      throw new HttpError(400, 'Invalid bonusType')
    }
    const bonus = await Bonus.create({
      title,
      description,
      image,
      bonusType: bonusType || 'other',
      bonusValue,
      termsAndConditions,
      order: order ?? 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      maxClaims: maxClaims !== undefined ? Number(maxClaims) : 1,
      cooldownHours: cooldownHours !== undefined ? Number(cooldownHours) : 0,
    })
    res.status(201).json({ success: true, data: bonus })
  } catch (e) {
    next(e)
  }
})

bonusRouter.put('/:id', ...adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid bonus id')
    }
    const bonus = await Bonus.findById(id)
    if (!bonus) throw new HttpError(404, 'Bonus not found')

    const {
      title,
      description,
      image,
      bonusType,
      bonusValue,
      termsAndConditions,
      order,
      isActive,
      validFrom,
      validUntil,
      maxClaims,
      cooldownHours,
    } = req.body ?? {}
    if (bonusType && !BONUS_TYPES.has(bonusType)) {
      throw new HttpError(400, 'Invalid bonusType')
    }
    if (title !== undefined) bonus.title = title
    if (description !== undefined) bonus.description = description
    if (image !== undefined) bonus.image = image
    if (bonusType !== undefined) bonus.bonusType = bonusType
    if (bonusValue !== undefined) bonus.bonusValue = bonusValue
    if (termsAndConditions !== undefined) bonus.termsAndConditions = termsAndConditions
    if (order !== undefined) bonus.order = Number(order)
    if (isActive !== undefined) bonus.isActive = Boolean(isActive)
    if (validFrom !== undefined) bonus.validFrom = validFrom ? new Date(validFrom) : undefined
    if (validUntil !== undefined) bonus.validUntil = validUntil ? new Date(validUntil) : undefined
    if (maxClaims !== undefined) bonus.maxClaims = Number(maxClaims)
    if (cooldownHours !== undefined) bonus.cooldownHours = Number(cooldownHours)
    await bonus.save()
    res.json({ success: true, data: bonus })
  } catch (e) {
    next(e)
  }
})

bonusRouter.delete('/:id', ...adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid bonus id')
    }
    const bonus = await Bonus.findByIdAndDelete(id)
    if (!bonus) throw new HttpError(404, 'Bonus not found')
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
})

bonusRouter.post('/:id/claim', authenticate as RequestHandler, async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const userId = r.userId!
    const bonusId = req.params.id
    if (!mongoose.Types.ObjectId.isValid(bonusId)) {
      throw new HttpError(400, 'Invalid bonus id')
    }

    const bonus = await Bonus.findById(bonusId)
    if (!bonus) throw new HttpError(404, 'Bonus not found')
    if (!bonus.isActive) {
      throw new HttpError(400, 'This bonus is not available')
    }

    const now = new Date()
    if (bonus.validFrom && new Date(bonus.validFrom) > now) {
      throw new HttpError(400, 'This bonus is not yet available')
    }
    if (bonus.validUntil && new Date(bonus.validUntil) < now) {
      throw new HttpError(400, 'This bonus has expired')
    }

    const userClaims = (bonus.claims || []).filter((c) => c.userId === userId)
    const claimCount = userClaims.length
    const maxClaims = bonus.maxClaims ?? 1
    const cooldownHrs = bonus.cooldownHours ?? 0

    if (cooldownHrs > 0) {
      if (maxClaims > 0 && claimCount >= maxClaims) {
        throw new HttpError(
          400,
          `You have reached the maximum of ${maxClaims} claim(s) for this bonus`,
        )
      }
      if (claimCount > 0) {
        const lastClaim = userClaims.reduce((a, b) =>
          new Date(a.claimedAt) > new Date(b.claimedAt) ? a : b,
        )
        const msSinceLast = Date.now() - new Date(lastClaim.claimedAt).getTime()
        const cooldownMs = cooldownHrs * 60 * 60 * 1000
        if (msSinceLast < cooldownMs) {
          const availableAt = new Date(new Date(lastClaim.claimedAt).getTime() + cooldownMs)
          throw new HttpError(
            400,
            `Bonus is on cooldown until ${availableAt.toISOString()}`,
          )
        }
      }
    } else {
      if (bonus.claimedBy.includes(userId)) {
        throw new HttpError(400, 'You have already claimed this bonus')
      }
    }

    bonus.claims.push({ userId, claimedAt: new Date() })
    if (!bonus.claimedBy.includes(userId)) bonus.claimedBy.push(userId)
    await bonus.save()

    const claimUser = await User.findById(userId).select('firstName lastName email').lean()
    if (claimUser) {
      const displayName =
        `${claimUser.firstName ?? ''} ${claimUser.lastName ?? ''}`.trim() ||
        claimUser.email.split('@')[0]
      try {
        const systemMessage = await ChatMessage.create({
          userId,
          senderType: 'system',
          message: `🎁 Bonus claim: "${bonus.title}" (${bonus.bonusType})${bonus.bonusValue ? ` — ${bonus.bonusValue}` : ''}`,
          status: 'unread',
          name: displayName,
          email: claimUser.email,
          metadata: {
            type: 'bonus_claim',
            bonusId: bonus._id.toString(),
            bonusTitle: bonus.title,
            bonusType: bonus.bonusType,
            ...(bonus.bonusValue ? { bonusValue: bonus.bonusValue } : {}),
            source: 'Bonuses',
          },
        })
        const io = tryGetSocketServerInstance()
        if (io) {
          const payload = serializeChatMessageDoc(
            systemMessage.toObject() as Parameters<typeof serializeChatMessageDoc>[0],
          )
          io.to('staff').emit('chat:message:new', payload)
          io.to(`user:${userId}`).emit('chat:message:new', payload)
        }
      } catch {
        /* chat optional */
      }
    }

    res.json({
      success: true,
      data: { bonusId: bonus._id, claimed: true },
    })
  } catch (e) {
    next(e)
  }
})
