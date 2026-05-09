import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    /** Digits-only normalized value (10–15 digits), unique */
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 20,
    },
    password: { type: String, required: true, select: false },
    isEmailVerified: { type: Boolean, default: false },
    /** 6-digit code emailed to the user (stored as string) */
    emailVerificationToken: { type: String, select: false, default: null },
    emailVerificationExpires: { type: Date, select: false, default: null },
    /** 6-digit code emailed for password reset (stored as string) */
    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, select: false, default: null },
    /** Unique code this user shares with others */
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    /** Set when they signed up with someone else's referralCode */
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** CRM labels assigned by agents (catalog in `Label` collection). */
    crmLabelIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Label' }],
      default: [],
    },
  },
  { timestamps: true },
)

export const User = mongoose.model('User', userSchema)
