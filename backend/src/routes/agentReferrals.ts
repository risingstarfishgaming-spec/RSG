import { Router } from 'express'
import mongoose from 'mongoose'
import { ChatMessage } from '../models/ChatMessage.js'
import { Referral } from '../models/Referral.js'
import { Staff } from '../models/Staff.js'
import { User } from '../models/User.js'
import type { StaffAuthedRequest } from '../middleware/authenticateStaff.js'
import { HttpError } from '../utils/HttpError.js'
import { serializeChatMessageDoc } from '../utils/chatMessageSerialize.js'
import { tryGetSocketServerInstance } from '../utils/socketManager.js'

/** Mounted under agent router (staff auth + agent role already applied). */
export const agentReferralsRouter = Router()

async function ensureReferralsPermission(req: StaffAuthedRequest) {
  const staff = await Staff.findById(req.staffId).select('permissions').lean()
  if (!staff) throw new HttpError(401, 'Staff not found')
  const perms = staff.permissions as string[] | undefined
  if (perms?.length && !perms.includes('referrals')) {
    throw new HttpError(403, 'Referrals permission required')
  }
}

function populatedUserPayload(u: Record<string, unknown> | null) {
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

agentReferralsRouter.get('/', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    await ensureReferralsPermission(r)
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

    const data = referrals.map((ref) => {
      const ru = ref.referredUser as unknown as Record<string, unknown> | null
      const rb = ref.referredBy as unknown as Record<string, unknown> | null
      return {
        _id: ref._id.toString(),
        referredUser: populatedUserPayload(ru),
        referredBy: rb
          ? {
              ...populatedUserPayload(rb)!,
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
    })

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (e) {
    next(e)
  }
})

agentReferralsRouter.post('/:id/verify', async (req, res, next) => {
  try {
    const r = req as unknown as StaffAuthedRequest
    await ensureReferralsPermission(r)
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid id')
    }

    const staff = await Staff.findById(r.staffId).select('firstName lastName email').lean()
    const staffLabel = staff
      ? `${staff.firstName} ${staff.lastName}`.trim() || staff.email
      : 'Staff'

    const referral = await Referral.findById(id)
    if (!referral) throw new HttpError(404, 'Referral not found')
    if (referral.status === 'verified') {
      throw new HttpError(400, 'Referral already verified')
    }

    referral.status = 'verified'
    referral.bonusGranted = true
    referral.verifiedAt = new Date()
    referral.verifiedBy = staffLabel
    await referral.save()

    const [referredUserDoc, referrerDoc] = await Promise.all([
      User.findById(referral.referredUser).select('firstName lastName email').lean(),
      User.findById(referral.referredBy).select('firstName lastName email').lean(),
    ])

    const referredName =
      referredUserDoc &&
      (`${referredUserDoc.firstName ?? ''} ${referredUserDoc.lastName ?? ''}`.trim() ||
        referredUserDoc.email.split('@')[0])
    const referrerName =
      referrerDoc &&
      (`${referrerDoc.firstName ?? ''} ${referrerDoc.lastName ?? ''}`.trim() ||
        referrerDoc.email.split('@')[0])

    const bonusAmt = referral.bonusAmount ?? 10

    const msgReferred = await ChatMessage.create({
      userId: referral.referredUser,
      senderType: 'system',
      message: `Your referral has been verified. Welcome to RSG!`,
      status: 'unread',
      name: referredName || 'User',
      email: referredUserDoc?.email,
      metadata: {
        type: 'referral_verified',
        referralId: referral._id.toString(),
        source: 'Referrals',
      },
    })

    const msgReferrer = await ChatMessage.create({
      userId: referral.referredBy,
      senderType: 'system',
      message: `Your friend's referral has been verified! You earned a $${bonusAmt} referral bonus.`,
      status: 'unread',
      name: referrerName || 'User',
      email: referrerDoc?.email,
      metadata: {
        type: 'referral_bonus',
        referralId: referral._id.toString(),
        bonusAmount: bonusAmt,
        source: 'Referrals',
      },
    })

    const io = tryGetSocketServerInstance()
    if (io) {
      for (const doc of [msgReferred, msgReferrer]) {
        const payload = serializeChatMessageDoc(
          doc.toObject() as Parameters<typeof serializeChatMessageDoc>[0],
        )
        io.to('staff').emit('chat:message:new', payload)
        io.to(`user:${payload.userId}`).emit('chat:message:new', payload)
      }
    }

    res.json({
      success: true,
      message: 'Referral verified',
      data: {
        referralId: referral._id.toString(),
        status: referral.status,
        bonusGranted: referral.bonusGranted,
      },
    })
  } catch (e) {
    next(e)
  }
})
