import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { Staff } from '../models/Staff.js'
import { authLoginLimiter } from '../middleware/rateLimiter.js'
import { HttpError } from '../utils/HttpError.js'
import { signStaffAccessToken } from '../utils/staffJwt.js'
import type { StaffRole } from '../models/Staff.js'

export const staffAuthRouter = Router()

const loginSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(1),
  /** Which panel — must match the account role. */
  intent: z.enum(['admin', 'agent']),
})

function publicStaff(s: {
  _id: { toString: () => string }
  email: string
  firstName: string
  lastName: string
  role: StaffRole
  permissions?: string[]
}) {
  return {
    id: s._id.toString(),
    email: s.email,
    firstName: s.firstName,
    lastName: s.lastName,
    role: s.role,
    ...(s.role === 'agent'
      ? {
          permissions: s.permissions?.length
            ? s.permissions
            : ['chat', 'clients', 'support', 'referrals'],
        }
      : {}),
  }
}

staffAuthRouter.post('/login', authLoginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid email or password')
    }
    const { email, password, intent } = parsed.data

    const staff = await Staff.findOne({ email }).select('+password').exec()
    if (!staff || !staff.isActive) {
      throw new HttpError(401, 'Invalid email or password')
    }
    if (staff.role !== intent) {
      throw new HttpError(
        403,
        intent === 'admin'
          ? 'This account is not an admin.'
          : 'This account is not an agent.',
      )
    }
    if (!(await bcrypt.compare(password, staff.password))) {
      throw new HttpError(401, 'Invalid email or password')
    }

    const token = signStaffAccessToken({
      sub: staff._id.toString(),
      email: staff.email,
      role: staff.role,
    })

    res.json({
      token,
      staff: publicStaff(staff),
    })
  } catch (e) {
    next(e)
  }
})
