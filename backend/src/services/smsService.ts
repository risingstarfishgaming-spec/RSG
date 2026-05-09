import { logger } from '../utils/logger.js'

export type BulkSmsPayload = {
  message: string
  /** E.164 or digits-only numbers */
  phoneNumbers: string[]
}

/**
 * Placeholder for Twilio / SNS / etc. Wire credentials and provider here.
 */
export async function sendBulkSms(payload: BulkSmsPayload): Promise<{
  accepted: number
  jobId: string
}> {
  logger.info(
    `Bulk SMS stub: ${payload.phoneNumbers.length} recipients, ${payload.message.length} chars`,
  )
  return {
    accepted: payload.phoneNumbers.length,
    jobId: `sms_stub_${Date.now()}`,
  }
}
