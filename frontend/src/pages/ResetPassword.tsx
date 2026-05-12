import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { AuthPasswordField, AuthTextField } from '../components/auth/AuthFields'
import { AuthScreenShell } from '../components/auth/AuthScreenShell'
import { PasswordStrengthMeter } from '../components/auth/PasswordStrength'
import { resetPasswordWithCode } from '../services/authApi'
import { useAuthStore } from '../stores/authStore'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  code: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, ''))
    .refine((d) => d.length === 6, 'Enter the 6-digit code from your email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
})

type FormValues = z.infer<typeof schema>

const btnPrimary =
  'btn-glow flex min-h-12 w-full touch-manipulation items-center justify-center rounded-2xl bg-[#FFD54A] px-4 py-3.5 text-base font-bold text-neutral-950 shadow-[0_8px_28px_rgba(255,213,74,0.2)] transition hover:bg-[#F5C73A] active:bg-[#E5B72F] disabled:cursor-not-allowed disabled:opacity-50'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const emailFromQuery = searchParams.get('email') ?? ''
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: emailFromQuery,
      code: '',
      password: '',
    },
  })

  const passwordValue = watch('password') ?? ''

  useEffect(() => {
    if (emailFromQuery) {
      setValue('email', emailFromQuery)
    }
  }, [emailFromQuery, setValue])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSuccessMessage(null)
    try {
      const res = await resetPasswordWithCode({
        email: values.email,
        code: values.code,
        password: values.password,
      })
      if (res.token && res.user) {
        setAuth(res.token, res.user)
        toast.success('Password updated — signed in')
        navigate('/profile', { replace: true, state: { justReset: true } })
        return
      }
      setSuccessMessage('Password updated. Redirecting to sign in…')
      window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1200)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Reset failed')
    }
  })

  return (
    <AuthScreenShell
      title="Reset password"
      subtitle="Enter the 6-digit code from your email and choose a new password."
      backTo="/forgot-password"
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
              {successMessage}
            </p>
          ) : null}

          <AuthTextField
            label="Email address"
            leftIcon="email"
            type="email"
            autoComplete="email"
            enterKeyHint="next"
            placeholder="you@example.com"
            autoFocus={!emailFromQuery}
            error={errors.email?.message}
            {...register('email')}
          />

          <AuthTextField
            label="Reset code"
            leftIcon="tag"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="next"
            maxLength={6}
            placeholder="000000"
            autoFocus={!!emailFromQuery}
            error={errors.code?.message}
            {...register('code')}
          />

          <div>
            <AuthPasswordField
              label="New password"
              registration={register('password')}
              autoComplete="new-password"
              enterKeyHint="done"
              placeholder="At least 8 characters"
              error={errors.password?.message}
            />
            <PasswordStrengthMeter password={passwordValue} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className={btnPrimary}
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500">
          <Link
            to="/forgot-password"
            className="font-semibold text-[#FFD54A] underline-offset-2 hover:underline"
          >
            Request a new code
          </Link>
          {' · '}
          <Link
            to="/login"
            className="font-semibold text-[#FFD54A] underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthFormCard>
    </AuthScreenShell>
  )
}
