import mongoose from 'mongoose'

const analyticsEventSchema = new mongoose.Schema(
  {
    ts: { type: Date, required: true, index: true },
    sessionId: { type: String, required: true, index: true, maxlength: 64 },
    type: { type: String, required: true, maxlength: 64, index: true },
    path: { type: String, trim: true, maxlength: 512, default: '' },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: false },
)

analyticsEventSchema.index({ ts: -1, type: 1 })
analyticsEventSchema.index({ path: 1, ts: -1 })

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema)
