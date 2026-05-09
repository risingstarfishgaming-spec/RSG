import mongoose from 'mongoose'

export type StaffRole = 'admin' | 'agent'

export type AgentPermission = 'chat' | 'clients' | 'support' | 'referrals'

const staffSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    role: {
      type: String,
      enum: ['admin', 'agent'] satisfies StaffRole[],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    /** Admin who created this agent account (null for bootstrap admins). */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    /** Agent panel tabs; admins ignore this. */
    permissions: {
      type: [String],
      default: ['chat', 'clients', 'support', 'referrals'],
    },
  },
  { timestamps: true },
)

export const Staff = mongoose.model('Staff', staffSchema)
