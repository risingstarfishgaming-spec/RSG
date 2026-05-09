import mongoose from 'mongoose'

const userNoteSchema = new mongoose.Schema(
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
    body: { type: String, required: true, trim: true, maxlength: 8000 },
  },
  { timestamps: true },
)

userNoteSchema.index({ userId: 1, staffId: 1, createdAt: -1 })

export const UserNote = mongoose.model('UserNote', userNoteSchema)
