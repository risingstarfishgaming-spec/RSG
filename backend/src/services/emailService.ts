import axios from 'axios'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const BREVO_API = 'https://api.brevo.com/v3/smtp/email'

function brevoConfigured(): boolean {
  return Boolean(env.brevoApiKey)
}

/**
 * Always provide a Reply-To so replies don't black-hole to a no-reply mailbox.
 * Prefers BREVO_REPLY_TO (e.g. support@…); falls back to BREVO_FROM_EMAIL so
 * production deployments without an explicit reply-to still get one.
 */
function defaultReplyTo(): { email: string; name?: string } | undefined {
  const explicit = env.brevoReplyTo
  if (explicit) return { email: explicit }
  if (env.brevoFromEmail && env.brevoFromEmail !== 'noreply@localhost') {
    return { email: env.brevoFromEmail, name: env.brevoFromName }
  }
  return undefined
}

/** Brevo returns { message, code } or nested errors — surface them in logs. */
function formatBrevoError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : String(err)
  }
  const status = err.response?.status
  const data = err.response?.data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const msg = typeof o.message === 'string' ? o.message : ''
    const code = typeof o.code === 'string' ? o.code : ''
    if (msg || code) {
      return [msg, code].filter(Boolean).join(' — ') + (status ? ` (HTTP ${status})` : '')
    }
    return `${JSON.stringify(data)}${status ? ` (HTTP ${status})` : ''}`
  }
  return err.message + (status ? ` (HTTP ${status})` : '')
}

type BrevoAttachment = {
  /** Display name shown in the email client. */
  name: string
  /** Base64-encoded file content (REST API spec). */
  content: string
}

type BrevoPayload = {
  sender: { name: string; email: string }
  to: { email: string; name?: string }[]
  bcc?: { email: string; name?: string }[]
  replyTo?: { email: string; name?: string }
  subject: string
  htmlContent: string
  tags?: string[]
  attachment?: BrevoAttachment[]
}

async function postTransactionalEmail(payload: BrevoPayload): Promise<void> {
  if (!brevoConfigured()) {
    logger.warn('BREVO_API_KEY missing — email not sent via Brevo')
    if (env.nodeEnv === 'production') {
      throw new Error(
        'Email service is not configured. Please contact support.',
      )
    }
    return
  }

  try {
    const { data } = await axios.post<{ messageId?: string }>(BREVO_API, payload, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': env.brevoApiKey,
      },
      timeout: 20_000,
    })
    logger.info(
      `Brevo accepted email (messageId: ${data?.messageId ?? 'n/a'}) → ${payload.to.map((t) => t.email).join(', ')}`,
    )
  } catch (e) {
    const detail = formatBrevoError(e)
    logger.error('Brevo SMTP API error:', detail)
    if (axios.isAxiosError(e) && e.response?.data) {
      logger.error('Brevo response body:', JSON.stringify(e.response.data))
    }
    throw new Error(`Brevo: ${detail}`)
  }
}

export async function sendVerificationEmail(params: {
  toEmail: string
  toName: string
  verificationCode: string
  verifyPageUrl: string
}): Promise<void> {
  const { toEmail, toName, verificationCode, verifyPageUrl } = params

  if (env.skipEmail) {
    logger.info(
      `[SKIP_EMAIL=true] Verification code for ${toEmail}: ${verificationCode} — page: ${verifyPageUrl}`,
    )
    return
  }

  if (!brevoConfigured()) {
    if (env.nodeEnv === 'production') {
      throw new Error(
        'Email service is not configured. Please contact support.',
      )
    }
    logger.warn('BREVO_API_KEY missing — logging verification code instead')
    logger.info(`Verification code for ${toEmail}: ${verificationCode}`)
    logger.info(`Open: ${verifyPageUrl}`)
    return
  }

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Hi ${toName},</p>
  <p>Thanks for joining RSFGaming. Use this code to verify your email:</p>
  <p style="font-size: 28px; font-weight: 800; letter-spacing: 0.25em; color: #111; margin: 24px 0;">${verificationCode}</p>
  <p>Enter it on the verification page (opens in your browser):<br/>
  <a href="${verifyPageUrl}" style="color: #2563eb;">${verifyPageUrl}</a></p>
  <p>This code expires in 24 hours. If you did not create an account, ignore this email.</p>
  <p>— RSFGaming</p>
</body>
</html>`

  const payload: BrevoPayload = {
    sender: {
      name: env.brevoFromName,
      email: env.brevoFromEmail,
    },
    to: [{ email: toEmail, name: toName }],
    subject: 'Your RSFGaming verification code',
    htmlContent: html,
  }
  const replyTo = defaultReplyTo()
  if (replyTo) payload.replyTo = replyTo

  await postTransactionalEmail(payload)
}

/** Loan lifecycle (Ace-compatible transactional HTML). */
export async function sendLoanTransactionalEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const { to, subject, html } = params

  if (env.skipEmail) {
    logger.info(`[SKIP_EMAIL=true] Loan email to ${to}: ${subject}`)
    return true
  }

  if (!brevoConfigured()) {
    logger.warn('BREVO_API_KEY missing — loan email not sent')
    return false
  }

  const payload: BrevoPayload = {
    sender: {
      name: env.brevoFromName,
      email: env.brevoFromEmail,
    },
    to: [{ email: to, name: to.split('@')[0] || 'Member' }],
    subject,
    htmlContent: html,
  }
  const replyTo = defaultReplyTo()
  if (replyTo) payload.replyTo = replyTo

  try {
    await postTransactionalEmail(payload)
    return true
  } catch {
    return false
  }
}

export async function sendPasswordResetEmail(params: {
  toEmail: string
  toName: string
  resetCode: string
  resetPageUrl: string
}): Promise<void> {
  const { toEmail, toName, resetCode, resetPageUrl } = params

  if (env.skipEmail) {
    logger.info(
      `[SKIP_EMAIL=true] Password reset code for ${toEmail}: ${resetCode} — page: ${resetPageUrl}`,
    )
    return
  }

  if (!brevoConfigured()) {
    if (env.nodeEnv === 'production') {
      throw new Error(
        'Email service is not configured. Please contact support.',
      )
    }
    logger.warn('BREVO_API_KEY missing — logging password reset code instead')
    logger.info(`Password reset code for ${toEmail}: ${resetCode}`)
    logger.info(`Open: ${resetPageUrl}`)
    return
  }

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Hi ${toName},</p>
  <p>We received a request to reset your RSFGaming password. Use this code:</p>
  <p style="font-size: 28px; font-weight: 800; letter-spacing: 0.25em; color: #111; margin: 24px 0;">${resetCode}</p>
  <p>Go to the reset page, enter this code, and choose a new password:<br/>
  <a href="${resetPageUrl}" style="color: #2563eb;">${resetPageUrl}</a></p>
  <p>This code expires in 1 hour. If you did not request a reset, ignore this email.</p>
  <p>— RSFGaming</p>
</body>
</html>`

  const payload: BrevoPayload = {
    sender: {
      name: env.brevoFromName,
      email: env.brevoFromEmail,
    },
    to: [{ email: toEmail, name: toName }],
    subject: 'Your RSFGaming password reset code',
    htmlContent: html,
  }
  const replyTo = defaultReplyTo()
  if (replyTo) payload.replyTo = replyTo

  await postTransactionalEmail(payload)
}

export type PromotionalSendResult = {
  total: number
  successful: number
  failed: number
  errors: string[]
}

/**
 * Send a promotional HTML email to many recipients.
 *
 * Sends one email per recipient (parallelised in small chunks) so each person
 * sees **their own address** in the "To" field — not a BCC, not the sender.
 * BCC blasts hide the recipient list, which looked like the email wasn't
 * addressed to them; this is the standard transactional-marketing pattern.
 *
 * Attachments are forwarded to Brevo's native `attachment` field (NOT embedded
 * as base64 data-URIs inside the HTML), which keeps the body well under
 * Gmail's 102KB clipping threshold even for multi-megabyte files.
 */
export async function sendPromotionalEmailBatches(params: {
  subject: string
  htmlContent: string
  recipientEmails: string[]
  attachments?: BrevoAttachment[]
}): Promise<PromotionalSendResult> {
  const { subject, htmlContent, recipientEmails, attachments } = params
  const unique = [...new Set(recipientEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  const result: PromotionalSendResult = {
    total: unique.length,
    successful: 0,
    failed: 0,
    errors: [],
  }

  if (unique.length === 0) {
    return result
  }

  if (env.skipEmail) {
    logger.info(
      `[SKIP_EMAIL=true] Promotional email "${subject}" → ${unique.length} recipient(s)`,
    )
    result.successful = unique.length
    return result
  }

  if (!brevoConfigured()) {
    if (env.nodeEnv === 'production') {
      throw new Error('Email service is not configured. Please contact support.')
    }
    logger.warn('BREVO_API_KEY missing — promotional email not sent')
    result.failed = unique.length
    result.errors.push('Brevo not configured')
    return result
  }

  const base: Omit<BrevoPayload, 'to' | 'bcc'> = {
    sender: { name: env.brevoFromName, email: env.brevoFromEmail },
    subject,
    htmlContent,
    tags: ['promotional'],
  }
  const replyTo = defaultReplyTo()
  if (replyTo) base.replyTo = replyTo
  if (attachments && attachments.length > 0) base.attachment = attachments

  /** Parallelise in small chunks; respect Brevo rate limits (~10–20 req/s). */
  const CONCURRENCY = 5
  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const slice = unique.slice(i, i + CONCURRENCY)
    const outcomes = await Promise.allSettled(
      slice.map((email) =>
        postTransactionalEmail({
          ...base,
          to: [{ email }],
        }),
      ),
    )
    for (let j = 0; j < outcomes.length; j++) {
      const o = outcomes[j]
      if (o.status === 'fulfilled') {
        result.successful += 1
      } else {
        result.failed += 1
        const detail = o.reason instanceof Error ? o.reason.message : String(o.reason)
        result.errors.push(`${slice[j]}: ${detail}`)
      }
    }
    /** Small inter-chunk pause helps avoid 429s on larger lists. */
    if (i + CONCURRENCY < unique.length) {
      await new Promise((r) => setTimeout(r, 250))
    }
  }

  return result
}
