import rateLimit from 'express-rate-limit'

export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { error: 'Too many registration attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authForgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: { error: 'Too many reset requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authResetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many reset attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authVerifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many verification attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/** Stricter: each call sends an email */
export const authResendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many code resend requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
