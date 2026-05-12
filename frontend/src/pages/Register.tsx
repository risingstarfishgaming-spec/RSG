import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { AuthPasswordField, AuthTextField } from '../components/auth/AuthFields'
import { AuthScreenShell } from '../components/auth/AuthScreenShell'
import { PasswordStrengthMeter } from '../components/auth/PasswordStrength'
import { registerAccount } from '../services/authApi'

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Enter a valid email').max(255),
  phoneNumber: z
    .string()
    .max(32, 'Phone number is too long')
    .optional()
    .transform((s) => {
      if (!s) return undefined
      return s.trim().replace(/\D/g, '')
    })
    .refine(
      (digits) =>
        digits === undefined ||
        digits === '' ||
        (digits.length >= 10 && digits.length <= 15),
      'Enter a valid phone number (10–15 digits) or leave it blank',
    )
    .transform((digits) => (digits ? digits : undefined)),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  referralCode: z
    .string()
    .max(20, 'Referral code is too long')
    .optional()
    .transform((s) => {
      if (!s) return undefined
      const t = s.trim().replace(/\s/g, '')
      if (!t) return undefined
      return t.toUpperCase()
    }),
})

const btnPrimary =
  'btn-glow flex min-h-12 w-full touch-manipulation items-center justify-center rounded-2xl bg-[#FFD54A] px-4 py-3.5 text-base font-bold text-neutral-950 shadow-[0_8px_28px_rgba(255,213,74,0.2)] transition hover:bg-[#F5C73A] active:bg-[#E5B72F] disabled:cursor-not-allowed disabled:opacity-50'

export default function Register() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      referralCode: '',
    },
  })

  const passwordValue = watch('password') ?? ''

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSuccessMessage(null)
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      ...(values.phoneNumber ? { phoneNumber: values.phoneNumber } : {}),
      ...(values.referralCode ? { referralCode: values.referralCode } : {}),
    }
    try {
      const res = await registerAccount(payload)
      setSuccessMessage(res.message)
      setTimeout(
        () =>
          navigate(
            `/verify-email?email=${encodeURIComponent(res.user.email)}`,
            {
              replace: true,
              state: { emailSent: res.emailSent },
            },
          ),
        900,
      )
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Registration failed')
    }
  })

  return (
    <AuthScreenShell
      title="Create account"
      subtitle="Create a new account to get started with seamless access to RSFGaming."
      backTo="/"
    >
      <AuthFormCard>
        <form className="flex flex-col gap-5 sm:gap-4" onSubmit={onSubmit} noValidate>
          {formError ? (
            <p
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm leading-snug text-red-300"
              role="alert"
            >
              {formError}
            </p>
          ) : null}
          {successMessage ? (
            <p
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm leading-snug text-emerald-200"
              role="status"
            >
              {successMessage} Taking you to email verification…
            </p>
          ) : null}

          <div className="flex flex-col gap-5 sm:grid sm:grid-cols-2 sm:gap-4">
            <AuthTextField
              label="First name"
              leftIcon="user"
              autoComplete="given-name"
              enterKeyHint="next"
              autoFocus
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <AuthTextField
              label="Last name"
              leftIcon="user"
              autoComplete="family-name"
              enterKeyHint="next"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <AuthTextField
            label="Email address"
            leftIcon="email"
            type="email"
            autoComplete="email"
            enterKeyHint="next"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <AuthTextField
            label={
              <>
                Phone number{' '}
                <span className="font-normal text-neutral-600">(optional)</span>
              </>
            }
            leftIcon="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            placeholder="+1 (555) 000-0000"
            error={errors.phoneNumber?.message}
            {...register('phoneNumber')}
          />
          <p className="-mt-3 text-xs leading-relaxed text-neutral-500">
            You can add this later. We use it to speed up payouts and support.
          </p>

          <div>
            <AuthPasswordField
              label="Password"
              registration={register('password')}
              autoComplete="new-password"
              enterKeyHint="done"
              placeholder="At least 8 characters"
              error={errors.password?.message}
            />
            <PasswordStrengthMeter password={passwordValue} />
          </div>

          <AuthTextField
            label={
              <>
                Referral code{' '}
                <span className="font-normal text-neutral-600">(optional)</span>
              </>
            }
            leftIcon="tag"
            autoComplete="off"
            autoCapitalize="characters"
            enterKeyHint="done"
            placeholder="Friend's code"
            error={errors.referralCode?.message}
            {...register('referralCode')}
          />

          <p className="text-center text-xs leading-relaxed text-neutral-500">
            By creating an account you agree to our{' '}
            <Link
              to="/terms"
              className="font-medium text-[#FFD54A] underline-offset-2 hover:underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              className="font-medium text-[#FFD54A] underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className={btnPrimary}
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#FFD54A] underline-offset-2 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </AuthFormCard>
    </AuthScreenShell>
  )
}
