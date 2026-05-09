import mongoose from 'mongoose'

const labelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    color: { type: String, trim: true, maxlength: 32, default: '#FFD700' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
  },
  { timestamps: true },
)

labelSchema.index({ name: 1 }, { unique: true })

export const Label = mongoose.model('Label', labelSchema)
