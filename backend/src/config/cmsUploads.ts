import fs from 'fs'
import multer from 'multer'
import os from 'os'
import path from 'path'

const imageMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function tempDir(sub: string) {
  const dir = path.join(os.tmpdir(), 'rsg-uploads', sub)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function makeUpload(subfolder: string, maxMb: number) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, tempDir(subfolder)),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.bin'
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
      },
    }),
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (imageMime.has(file.mimetype)) {
        cb(null, true)
        return
      }
      cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'))
    },
  })
}

export const bonusImageUpload = makeUpload('bonuses', 8)
export const platformImageUpload = makeUpload('platforms', 8)
