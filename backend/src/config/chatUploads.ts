import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const allowedMime = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
])

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const chatUploadsDir = path.resolve(__dirname, '../../uploads/chat')
fs.mkdirSync(chatUploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, chatUploadsDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now()
    const sanitized = file.originalname.replace(/\s+/g, '-')
    cb(null, `${timestamp}-${sanitized}`)
  },
})

export const chatAttachmentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.has(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new Error('Invalid attachment type'))
  },
})

export function getChatAttachmentUrl(filename: string): string {
  return `/uploads/chat/${filename}`
}
