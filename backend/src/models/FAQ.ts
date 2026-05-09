import mongoose from 'mongoose'

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    category: { type: String, trim: true, default: 'general' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

faqSchema.index({ isActive: 1, order: 1 })
faqSchema.index({ createdAt: -1 })

export const FAQ = mongoose.model('FAQ', faqSchema)
