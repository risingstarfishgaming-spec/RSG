import fs from 'fs'
import { Router, type RequestHandler } from 'express'
import mongoose from 'mongoose'
import { Platform } from '../models/Platform.js'
import { authenticateStaff, requireStaffRole } from '../middleware/authenticateStaff.js'
import { HttpError } from '../utils/HttpError.js'
import { platformImageUpload } from '../config/cmsUploads.js'
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from '../config/cloudinaryClient.js'

export const platformRouter = Router()

platformRouter.get('/', async (_req, res, next) => {
  try {
    const platforms = await Platform.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-__v')
      .lean()
    res.json({ success: true, data: platforms })
  } catch (e) {
    next(e)
  }
})

const adminOnly: RequestHandler[] = [
  authenticateStaff as RequestHandler,
  requireStaffRole('admin') as RequestHandler,
]

platformRouter.get('/all', ...adminOnly, async (_req, res, next) => {
  try {
    const platforms = await Platform.find()
      .sort({ order: 1, createdAt: -1 })
      .select('-__v')
      .lean()
    res.json({ success: true, data: platforms })
  } catch (e) {
    next(e)
  }
})

platformRouter.post(
  '/upload-image',
  ...adminOnly,
  platformImageUpload.single('image'),
  async (req, res, next) => {
    try {
      const file = req.file
      if (!file) {
        throw new HttpError(400, 'No image file provided')
      }
      configureCloudinary()
      let imageUrl: string
      if (isCloudinaryConfigured()) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'platforms',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        })
        imageUrl = result.secure_url
        fs.unlink(file.path, () => {})
      } else {
        throw new HttpError(503, 'Image upload requires Cloudinary configuration')
      }
      res.json({ success: true, data: { url: imageUrl } })
    } catch (e) {
      if (req.file) fs.unlink(req.file.path, () => {})
      next(e)
    }
  },
)

platformRouter.post('/', ...adminOnly, async (req, res, next) => {
  try {
    const { name, description, image, gameLink, order, isActive } = req.body ?? {}
    if (!name || !description || !image || !gameLink) {
      throw new HttpError(400, 'Name, description, image, and gameLink are required')
    }
    const platform = await Platform.create({
      name,
      description,
      image,
      gameLink,
      order: order ?? 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    })
    res.status(201).json({ success: true, data: platform })
  } catch (e) {
    next(e)
  }
})

platformRouter.put('/:id', ...adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid platform id')
    }
    const platform = await Platform.findById(id)
    if (!platform) throw new HttpError(404, 'Platform not found')

    const { name, description, image, gameLink, order, isActive } = req.body ?? {}
    if (name !== undefined) platform.name = name
    if (description !== undefined) platform.description = description
    if (image !== undefined) platform.image = image
    if (gameLink !== undefined) platform.gameLink = gameLink
    if (order !== undefined) platform.order = Number(order)
    if (isActive !== undefined) platform.isActive = Boolean(isActive)
    await platform.save()
    res.json({ success: true, data: platform })
  } catch (e) {
    next(e)
  }
})

platformRouter.delete('/:id', ...adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid platform id')
    }
    const platform = await Platform.findByIdAndDelete(id)
    if (!platform) throw new HttpError(404, 'Platform not found')
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
})
