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
    /**
     * Digits-only normalized value (10–15 digits). Optional at signup; users can
     * add it later from Profile (e.g. before payouts). Index is sparse so any
     * number of users without a phone can coexist while still enforcing
     * uniqueness when one is set.
     */
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      maxlength: 20,
      default: undefined,
    },
    password: { type: String, required: true, select: false },
    /**
     * Timestamp of last password change. JWTs issued with `iat` older than this
     * are rejected by the authenticate middleware so a password reset
     * effectively signs the user out everywhere else.
     */
    passwordChangedAt: { type: Date, default: null },
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

userSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true })

export const User = mongoose.model('User', userSchema)
