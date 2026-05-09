import mongoose from 'mongoose'

const bonusClaimSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    claimedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

export type BonusType = 'welcome' | 'deposit' | 'free_spins' | 'cashback' | 'other'

const bonusSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    image: { type: String, required: true, trim: true },
    bonusType: {
      type: String,
      enum: ['welcome', 'deposit', 'free_spins', 'cashback', 'other'] satisfies BonusType[],
      default: 'other',
    },
    bonusValue: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true, maxlength: 2000 },
    isActive: { type: Boolean, default: true },
    maxClaims: { type: Number, default: 1, min: 0 },
    cooldownHours: { type: Number, default: 0, min: 0 },
    claimedBy: { type: [String], default: [] },
    claims: { type: [bonusClaimSchema], default: [] },
    order: { type: Number, default: 0 },
    validFrom: { type: Date },
    validUntil: { type: Date },
  },
  { timestamps: true },
)

bonusSchema.index({ isActive: 1, order: 1 })
bonusSchema.index({ createdAt: -1 })
bonusSchema.index({ validFrom: 1, validUntil: 1 })
bonusSchema.index({ 'claims.userId': 1 })

export const Bonus = mongoose.model('Bonus', bonusSchema)
