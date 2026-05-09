import mongoose from 'mongoose'

const platformSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    image: { type: String, required: true, trim: true },
    gameLink: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

platformSchema.index({ isActive: 1, order: 1 })
platformSchema.index({ createdAt: -1 })

export const Platform = mongoose.model('Platform', platformSchema)
