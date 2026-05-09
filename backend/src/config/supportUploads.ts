import fs from 'fs'
import multer from 'multer'
import os from 'os'
import path from 'path'

const allowedMime = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
])

function tempDir() {
  const dir = path.join(os.tmpdir(), 'rsg-uploads', 'support')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export const supportAttachmentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tempDir()),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.bin'
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.has(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new Error('Only images (JPEG, PNG, WebP, GIF) or PDF are allowed'))
  },
})
