import fs from 'fs'
import {
  cloudinary,
  configureCloudinary,
  isCloudinaryConfigured,
} from '../config/cloudinaryClient.js'
import { getChatAttachmentUrl } from '../config/chatUploads.js'
import { logger } from './logger.js'

/** Upload to Cloudinary when configured; on failure or when unset, keep local file and return `/uploads/chat/...` URL. */
export async function storeChatAttachment(
  file: { path: string; filename: string },
  folderUserId: string,
): Promise<string> {
  if (!file?.path || !file.filename) {
    throw new Error('Invalid upload file')
  }
  if (!fs.existsSync(file.path)) {
    logger.warn('Chat upload file missing on disk')
    return getChatAttachmentUrl(file.filename)
  }
  if (isCloudinaryConfigured()) {
    configureCloudinary()
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `chat/${folderUserId}`,
        resource_type: 'auto',
      })
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
      return result.secure_url
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn('Cloudinary upload failed, using local storage', msg)
    }
  }
  return getChatAttachmentUrl(file.filename)
}
