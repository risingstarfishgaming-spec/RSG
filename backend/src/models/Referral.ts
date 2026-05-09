import mongoose from 'mongoose'

const referralSchema = new mongoose.Schema(
  {
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referralCode: { type: String, required: true, uppercase: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending',
      index: true,
    },
    bonusGranted: { type: Boolean, default: false },
    bonusAmount: { type: Number, default: 10 },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, trim: true },
  },
  { timestamps: true },
)

referralSchema.index({ referredUser: 1, referredBy: 1 }, { unique: true })
referralSchema.index({ status: 1, createdAt: -1 })

export const Referral = mongoose.model('Referral', referralSchema)
