import mongoose from 'mongoose'

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info',
    },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 1, min: 1, max: 3 },
    expiresAt: { type: Date },
  },
  { timestamps: true },
)

noticeSchema.index({ isActive: 1, priority: 1, createdAt: -1 })
noticeSchema.index({ expiresAt: 1 })

export const Notice = mongoose.model('Notice', noticeSchema)
