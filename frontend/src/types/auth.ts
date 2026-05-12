export type AuthUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  /** Normalized digits-only (matches API). Empty string when not provided. */
  phoneNumber: string
  isEmailVerified: boolean
  referralCode: string
}

