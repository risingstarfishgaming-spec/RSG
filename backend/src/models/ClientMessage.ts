import mongoose from 'mongoose'

/** Agent ↔ client thread (MVP: stored messages; real-time chat can layer on later). */
const clientMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['agent_to_user', 'user_to_agent'],
      required: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
)

clientMessageSchema.index({ userId: 1, staffId: 1, createdAt: -1 })

export const ClientMessage = mongoose.model('ClientMessage', clientMessageSchema)
