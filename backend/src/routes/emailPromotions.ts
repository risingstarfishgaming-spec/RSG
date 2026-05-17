import fs from 'fs'
import type { RequestHandler } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { emailPromoAttachmentUpload } from '../config/emailPromoUploads.js'
import { sendPromotionalEmailBatches } from '../services/emailService.js'
import {
  resolveBulkEmailRecipients,
  type BulkEmailRecipientInput,
} from '../utils/bulkEmailRecipients.js'
import { HttpError } from '../utils/HttpError.js'
import { buildPromotionalEmailHtml } from '../utils/promotionalEmailTemplate.js'
import { logger } from '../utils/logger.js'

export const emailPromotionsRouter = Router()

function cleanupAttachment(file?: { path: string }) {
  if (file?.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path)
    } catch (e) {
      logger.warn('email promo attachment cleanup failed:', e)
    }
  }
}

function parseJsonArray(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string')
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((x) => typeof x === 'string')
      }
    } catch {
      return []
    }
  }
  return []
}

const recipientFieldsSchema = z.object({
  sendToAll: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  recipientIds: z.union([z.string(), z.array(z.string())]).optional(),
  labelIds: z.union([z.string(), z.array(z.string())]).optional(),
  labelMatch: z.enum(['any', 'all']).optional().default('any'),
  recipientEmails: z.union([z.string(), z.array(z.string())]).optional(),
})

/**
 * IMPORTANT: do NOT fall back to `sendToAll=true` when no recipients are
 * specified — that would silently blast every member if the frontend payload
 * was constructed incorrectly. The route below rejects empty recipient sets
 * with a 400 via `resolveBulkEmailRecipients`.
 */
function buildRecipientInput(body: z.infer<typeof recipientFieldsSchema>): BulkEmailRecipientInput {
  return {
    sendToAll: body.sendToAll === true,
    userIds: parseJsonArray(body.recipientIds),
    labelIds: parseJsonArray(body.labelIds),
    labelMatch: body.labelMatch,
    emails: parseJsonArray(body.recipientEmails),
  }
}

const previewHandler: RequestHandler = async (req, res, next) => {
  try {
    const {
      subject,
      emailBody,
      headerTitle,
      headerSubtitle,
      preheader,
      ctaLabel,
      ctaUrl,
    } = req.body as Record<string, string>
    if (!emailBody?.trim()) {
      throw new HttpError(400, 'Email body is required')
    }
    const attachment = req.file
    const html = await buildPromotionalEmailHtml({
      subject: subject || 'Email Preview',
      emailBody,
      headerTitle,
      headerSubtitle,
      preheader,
      ctaLabel,
      ctaUrl,
      attachment: attachment
        ? {
            path: attachment.path,
            mimetype: attachment.mimetype,
            originalname: attachment.originalname,
          }
        : undefined,
    })
    cleanupAttachment(attachment)
    res.json({ success: true, html })
  } catch (e) {
    cleanupAttachment(req.file)
    next(e)
  }
}

emailPromotionsRouter.post(
  '/preview',
  emailPromoAttachmentUpload.single('attachment'),
  previewHandler,
)

const recipientsPreviewSchema = recipientFieldsSchema

emailPromotionsRouter.post('/recipients/preview', async (req, res, next) => {
  try {
    const parsed = recipientsPreviewSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '))
    }
    const resolved = await resolveBulkEmailRecipients(buildRecipientInput(parsed.data))
    res.json({ success: true, data: resolved.stats })
  } catch (e) {
    next(e)
  }
})

emailPromotionsRouter.post(
  '/send',
  emailPromoAttachmentUpload.single('attachment'),
  async (req, res, next) => {
    /**
     * Per-recipient sends to Brevo (5 concurrent, 250ms pause between chunks)
     * easily exceed the global 30s connect-timeout for large lists. Clear the
     * timeout for this single route so a 1000-recipient blast (~3 min) can
     * complete. `req.clearTimeout` is provided by the `connect-timeout` mw.
     */
    type ReqWithClearTimeout = typeof req & { clearTimeout?: () => void }
    ;(req as ReqWithClearTimeout).clearTimeout?.()
    req.setTimeout(10 * 60 * 1000)
    res.setTimeout(10 * 60 * 1000)

    const attachment = req.file
    try {
      const {
        subject,
        emailBody,
        headerTitle,
        headerSubtitle,
        preheader,
        ctaLabel,
        ctaUrl,
      } = req.body as Record<string, string>
      if (!subject?.trim()) throw new HttpError(400, 'Subject is required')
      if (!emailBody?.trim()) throw new HttpError(400, 'Email body is required')

      const parsed = recipientsPreviewSchema.safeParse(req.body)
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '))
      }

      const resolved = await resolveBulkEmailRecipients(buildRecipientInput(parsed.data))
      const html = await buildPromotionalEmailHtml({
        subject,
        emailBody,
        headerTitle,
        headerSubtitle,
        preheader,
        ctaLabel,
        ctaUrl,
        attachment: attachment
          ? {
              path: attachment.path,
              mimetype: attachment.mimetype,
              originalname: attachment.originalname,
            }
          : undefined,
      })

      // Forward the real file to Brevo (not embedded in HTML — see template note)
      const brevoAttachments = attachment
        ? [
            {
              name: attachment.originalname,
              content: fs.readFileSync(attachment.path).toString('base64'),
            },
          ]
        : undefined

      const sendResult = await sendPromotionalEmailBatches({
        subject,
        htmlContent: html,
        recipientEmails: resolved.recipientEmails,
        attachments: brevoAttachments,
      })

      cleanupAttachment(attachment)

      const message =
        sendResult.failed > 0
          ? `Sent to ${sendResult.successful} of ${sendResult.total} recipients. ${sendResult.failed} failed.`
          : `Successfully sent to ${sendResult.successful} recipient(s).`

      res.json({
        success: sendResult.failed === 0,
        message,
        stats: resolved.stats,
        sendResult,
      })
    } catch (e) {
      cleanupAttachment(attachment)
      next(e)
    }
  },
)
