import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info',
      required: true,
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    link: { type: String, trim: true, maxlength: 500 },
    noticeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice' },
  },
  { timestamps: true },
)

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ createdAt: -1 })

export const Notification = mongoose.model('Notification', notificationSchema)
