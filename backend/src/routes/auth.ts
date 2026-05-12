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
  email: z.string().trim().email('Invalid email').max(255).toLowerCase(),
  phoneNumber: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((s) => {
      if (!s) return undefined
      return s.replace(/\D/g, '')
    })
    .refine(
      (digits) =>
        digits === undefined ||
        digits === '' ||
        (digits.length >= 10 && digits.length <= 15),
      'Enter a valid phone number (10–15 digits)',
    )
    .transform((digits) => (digits ? digits : undefined)),
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
  phoneNumber?: string | null
  isEmailVerified: boolean
  referralCode: string
  referredBy?: unknown
}) {
  return {
    id: u._id.toString(),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber ?? '',
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
      ...(phoneNumber ? { phoneNumber } : {}),
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

    const verifyPageUrl = `${env.publicAppUrl}/verify-email?email=${encodeURIComponent(user.email)}`

    let emailSent = true
    try {
      await sendVerificationEmail({
        toEmail: user.email,
        toName: `${user.firstName} ${user.lastName}`,
        verificationCode,
        verifyPageUrl,
      })
    } catch (e) {
      logger.error('sendVerificationEmail failed:', e)
      emailSent = false
    }

    res.status(201).json({
      message: emailSent
        ? 'Account created. Enter the 6-digit code from your email to verify your address.'
        : "Account created, but we couldn't send the verification email right now. Use the Resend code button on the next page.",
      emailSent,
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
        'Invalid or expired code. Double-check the digits or tap "Resend code" to get a fresh one.',
      )
    }

    user.isEmailVerified = true
    user.emailVerificationToken = null
    user.emailVerificationExpires = null
    await user.save()

    const token = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
    })

    res.json({
      message: "Email verified. You're signed in.",
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

      const genericMessage =
        'If an unverified account matches this email, we sent a new 6-digit code. It may take a minute to arrive.'

      const user = await User.findOne({ email }).select(
        '+emailVerificationToken +emailVerificationExpires',
      )

      // Quietly no-op for unknown emails and already-verified accounts so the
      // response cannot be used to enumerate accounts or verification status.
      if (!user || user.isEmailVerified) {
        res.json({ message: genericMessage })
        return
      }

      const verificationCode = generateEmailVerificationCode()
      const verifyExpires = new Date(Date.now() + VERIFY_TTL_MS)
      user.emailVerificationToken = verificationCode
      user.emailVerificationExpires = verifyExpires
      await user.save()

      const verifyPageUrl = `${env.publicAppUrl}/verify-email?email=${encodeURIComponent(user.email)}`

      try {
        await sendVerificationEmail({
          toEmail: user.email,
          toName: `${user.firstName} ${user.lastName}`,
          verificationCode,
          verifyPageUrl,
        })
      } catch (e) {
        logger.error('sendVerificationEmail (resend) failed:', e)
        throw new HttpError(
          503,
          "We couldn't send your verification email right now. Try again in a minute.",
          'EMAIL_SEND_FAILED',
        )
      }

      res.json({ message: genericMessage })
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

    const genericMessage =
      'If an account exists for this email, we sent a 6-digit code. Enter it on the next step with your new password.'

    const user = await User.findOne({ email: parsed.data.email })
    if (!user) {
      // Quietly no-op so the response cannot be used to enumerate accounts.
      res.json({ message: genericMessage })
      return
    }

    const resetCode = generateEmailVerificationCode()
    const resetExpires = new Date(Date.now() + RESET_TTL_MS)
    user.passwordResetToken = resetCode
    user.passwordResetExpires = resetExpires
    await user.save()

    const resetPageUrl = `${env.publicAppUrl}/reset-password?email=${encodeURIComponent(user.email)}`

    try {
      await sendPasswordResetEmail({
        toEmail: user.email,
        toName: `${user.firstName} ${user.lastName}`,
        resetCode,
        resetPageUrl,
      })
    } catch (e) {
      logger.error('sendPasswordResetEmail failed:', e)
      throw new HttpError(
        503,
        "We couldn't send the reset email right now. Try again in a minute.",
        'EMAIL_SEND_FAILED',
      )
    }

    res.json({ message: genericMessage })
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
    // Bumping passwordChangedAt invalidates any JWT issued before this moment;
    // the new JWT below is dated `iat` ≈ now and survives thanks to the skew
    // buffer in the authenticate middleware.
    user.passwordChangedAt = new Date()
    await user.save()

    const token = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
    })

    res.json({
      message: "Password updated. You're signed in.",
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
