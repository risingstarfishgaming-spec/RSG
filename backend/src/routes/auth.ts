import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { randomInt } from 'node:crypto'
import { z } from 'zod'
import { env } from '../config/env.js'
import type { AuthedRequest } from '../middleware/authenticate.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  authForgotPasswordLimiter,
  authLoginLimiter,
  authRegisterLimiter,
  authResendVerificationLimiter,
  authResetPasswordLimiter,
  authVerifyEmailLimiter,
} from '../middleware/rateLimiter.js'
import { Referral } from '../models/Referral.js'
import { User } from '../models/User.js'
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../services/emailService.js'
import { HttpError } from '../utils/HttpError.js'
import { logger } from '../utils/logger.js'
import { signAccessToken } from '../utils/jwt.js'
import { generateUniqueReferralCode } from '../utils/referralCode.js'

export const authRouter = Router()

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Invalid email').max(255),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .transform((s) => s.replace(/\D/g, ''))
    .refine(
      (digits) => digits.length >= 10 && digits.length <= 15,
      'Enter a valid phone number (10–15 digits)',
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  referralCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((s) => {
      if (!s) return undefined
      return s.toUpperCase().replace(/\s/g, '')
    }),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(1),
})

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000
const RESET_TTL_MS = 60 * 60 * 1000

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email').max(255).toLowerCase(),
})

const resetPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email').max(255).toLowerCase(),
  code: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, ''))
    .refine((d) => d.length === 6, 'Enter the 6-digit code from your email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
})

const verifyEmailBodySchema = z.object({
  email: z.string().trim().email('Invalid email').max(255).toLowerCase(),
  code: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, ''))
    .refine((d) => d.length === 6, 'Enter the 6-digit code from your email'),
})

const resendVerificationSchema = z.object({
  email: z.string().trim().email('Invalid email').max(255).toLowerCase(),
})

function generateEmailVerificationCode(): string {
  return String(randomInt(100_000, 1_000_000))
}

function publicUser(u: {
  _id: { toString: () => string }
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  isEmailVerified: boolean
  referralCode: string
  referredBy?: unknown
}) {
  return {
    id: u._id.toString(),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    isEmailVerified: u.isEmailVerified,
    referralCode: u.referralCode,
  }
}

authRouter.post('/register', authRegisterLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ')
      throw new HttpError(400, msg)
    }
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      referralCode: inputReferral,
    } = parsed.data

    let referredById: null | import('mongoose').Types.ObjectId = null
    if (inputReferral) {
      const referrer = await User.findOne({ referralCode: inputReferral })
      if (!referrer) {
        throw new HttpError(400, 'Invalid referral code')
      }
      referredById = referrer._id
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationCode = generateEmailVerificationCode()
    const verifyExpires = new Date(Date.now() + VERIFY_TTL_MS)
    const myReferralCode = await generateUniqueReferralCode(
      async (code) => !!(await User.exists({ referralCode: code })),
    )

    const user = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: passwordHash,
      isEmailVerified: false,
      emailVerificationToken: verificationCode,
      emailVerificationExpires: verifyExpires,
      referralCode: myReferralCode,
      referredBy: referredById,
    })

    if (referredById && inputReferral) {
      try {
        await Referral.create({
          referredUser: user._id,
          referredBy: referredById,
          referralCode: inputReferral.toUpperCase().trim(),
        })
      } catch (refErr) {
        logger.warn('Referral record not created (may already exist)', refErr)
      }
    }

    const verifyPageUrl = `${env.frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(user.email)}`

    sendVerificationEmail({
      toEmail: user.email,
      toName: `${user.firstName} ${user.lastName}`,
      verificationCode,
      verifyPageUrl,
    }).catch((e) => {
      logger.error('sendVerificationEmail failed:', e)
    })

    res.status(201).json({
      message:
        'Account created. Enter the 6-digit code from your email to verify your address before signing in.',
      user: publicUser(user),
    })
  } catch (e: unknown) {
    if (
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as { code: number }).code === 11000
    ) {
      const keyPattern = (e as { keyPattern?: Record<string, number> }).keyPattern
      const key = keyPattern ? Object.keys(keyPattern)[0] : ''
      if (key === 'phoneNumber') {
        next(new HttpError(409, 'Phone number already registered'))
        return
      }
      next(new HttpError(409, 'Email already registered'))
      return
    }
    next(e)
  }
})

authRouter.post('/login', authLoginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid email or password')
    }
    const { email, password } = parsed.data

    const user = await User.findOne({ email })
      .select('+password +isEmailVerified')
      .exec()

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new HttpError(401, 'Invalid email or password')
    }

    if (!user.isEmailVerified) {
      throw new HttpError(
        403,
        'Please verify your email before signing in. Check your inbox for the 6-digit code.',
        'EMAIL_NOT_VERIFIED',
      )
    }

    const token = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
    })

    res.json({
      token,
      user: publicUser({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        referralCode: user.referralCode,
      }),
    })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/verify-email', authVerifyEmailLimiter, async (req, res, next) => {
  try {
    const parsed = verifyEmailBodySchema.safeParse(req.body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ')
      throw new HttpError(400, msg)
    }
    const { email, code } = parsed.data

    const user = await User.findOne({
      email,
      emailVerificationToken: code,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires')

    if (!user) {
      throw new HttpError(
        400,
        'Invalid or expired code. Check the code or request a new one from support.',
      )
    }

    user.isEmailVerified = true
    user.emailVerificationToken = null
    user.emailVerificationExpires = null
    await user.save()

    res.json({ message: 'Email verified. You can sign in now.' })
  } catch (e) {
    next(e)
  }
})

authRouter.post(
  '/resend-verification',
  authResendVerificationLimiter,
  async (req, res, next) => {
    try {
      const parsed = resendVerificationSchema.safeParse(req.body)
      if (!parsed.success) {
        throw new HttpError(400, 'Invalid email')
      }
      const { email } = parsed.data

      const user = await User.findOne({ email }).select(
        '+emailVerificationToken +emailVerificationExpires',
      )
      if (!user) {
        throw new HttpError(
          404,
          "Incorrect email or user doesn't exist.",
        )
      }

      if (user.isEmailVerified) {
        throw new HttpError(
          400,
          'This email is already verified. You can sign in.',
        )
      }

      const verificationCode = generateEmailVerificationCode()
      const verifyExpires = new Date(Date.now() + VERIFY_TTL_MS)
      user.emailVerificationToken = verificationCode
      user.emailVerificationExpires = verifyExpires
      await user.save()

      const verifyPageUrl = `${env.frontendUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(user.email)}`

      sendVerificationEmail({
        toEmail: user.email,
        toName: `${user.firstName} ${user.lastName}`,
        verificationCode,
        verifyPageUrl,
      }).catch((e) => {
        logger.error('sendVerificationEmail (resend) failed:', e)
      })

      res.json({
        message:
          'We sent a new 6-digit code to your inbox. It may take a minute to arrive.',
      })
    } catch (e) {
      next(e)
    }
  },
)

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const r = req as AuthedRequest
    const user = await User.findById(r.userId).lean()
    if (!user) {
      throw new HttpError(401, 'User not found')
    }
    res.json({ user: publicUser(user as Parameters<typeof publicUser>[0]) })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/forgot-password', authForgotPasswordLimiter, async (req, res, next) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid email')
    }
    const user = await User.findOne({ email: parsed.data.email })
    if (!user) {
      throw new HttpError(
        404,
        "Incorrect email or user doesn't exist.",
      )
    }

    const resetCode = generateEmailVerificationCode()
    const resetExpires = new Date(Date.now() + RESET_TTL_MS)
    user.passwordResetToken = resetCode
    user.passwordResetExpires = resetExpires
    await user.save()

    const resetPageUrl = `${env.frontendUrl.replace(/\/$/, '')}/reset-password?email=${encodeURIComponent(user.email)}`

    sendPasswordResetEmail({
      toEmail: user.email,
      toName: `${user.firstName} ${user.lastName}`,
      resetCode,
      resetPageUrl,
    }).catch((e) => {
      logger.error('sendPasswordResetEmail failed:', e)
    })

    res.json({
      message:
        'We emailed a 6-digit code to this address. Enter it on the next step with your new password.',
    })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/reset-password', authResetPasswordLimiter, async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ')
      throw new HttpError(400, msg)
    }
    const { email, code, password } = parsed.data

    const user = await User.findOne({
      email,
      passwordResetToken: code,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +password')

    if (!user) {
      throw new HttpError(
        400,
        'Invalid or expired code. Request a new code from Forgot password.',
      )
    }

    user.password = await bcrypt.hash(password, 12)
    user.passwordResetToken = null
    user.passwordResetExpires = null
    await user.save()

    res.json({ message: 'Password updated. You can sign in now.' })
  } catch (e) {
    next(e)
  }
})
