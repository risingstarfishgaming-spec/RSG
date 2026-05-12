import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { AuthTextField } from '../components/auth/AuthFields'
import { AuthScreenShell } from '../components/auth/AuthScreenShell'
import { resendVerificationCode, verifyEmailWithCode } from '../services/authApi'
import { useAuthStore } from '../stores/authStore'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  code: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, ''))
    .refine((d) => d.length === 6, 'Enter the 6-digit code from your email'),
})

type FormValues = z.infer<typeof schema>

const btnPrimary =
  'btn-glow flex min-h-12 w-full touch-manipulation items-center justify-center rounded-2xl bg-[#FFD54A] px-4 py-3.5 text-base font-bold text-neutral-950 shadow-[0_8px_28px_rgba(255,213,74,0.2)] transition hover:bg-[#F5C73A]'
export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const navState = location.state as
    | { fromLogin?: boolean; emailSent?: boolean }
    | null
  const fromLogin = Boolean(navState?.fromLogin)
  const emailDeliveryFailed = navState?.emailSent === false
  const [searchParams] = useSearchParams()
  const emailFromQuery = searchParams.get('email') ?? ''
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldownUntil, setResendCooldownUntil] = useState<number | null>(
    null,
  )
  const [, setResendCooldownTick] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailFromQuery, code: '' },
  })

  useEffect(() => {
    if (emailFromQuery) {
      setValue('email', emailFromQuery)
    }
  }, [emailFromQuery, setValue])

  useEffect(() => {
    if (resendCooldownUntil == null) return
    const id = window.setInterval(() => {
      setResendCooldownTick((n) => n + 1)
      if (Date.now() >= resendCooldownUntil) {
        setResendCooldownUntil(null)
        window.clearInterval(id)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [resendCooldownUntil])

  const resendCooldownSeconds =
    resendCooldownUntil != null
      ? Math.max(0, Math.ceil((resendCooldownUntil - Date.now()) / 1000))
      : 0

  const onResend = async () => {
    setResendError(null)
    setResendMessage(null)
    const email = getValues('email').trim()
    const parsed = z.string().trim().email().safeParse(email)
    if (!parsed.success) {
      setResendError('Enter a valid email address first.')
      return
    }
    setIsResending(true)
    try {
      const res = await resendVerificationCode(parsed.data)
      setResendMessage(res.message)
      setResendCooldownUntil(Date.now() + 60_000)
    } catch (e) {
      setResendError(e instanceof Error ? e.message : 'Could not resend code')
    } finally {
      setIsResending(false)
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null)
    setSuccessMessage(null)
    setResendMessage(null)
    setResendError(null)
    try {
      const res = await verifyEmailWithCode({
        email: data.email,
        code: data.code,
      })
      if (res.token && res.user) {
        setAuth(res.token, res.user)
        toast.success('Welcome — your email is verified!')
        navigate('/bonuses', { replace: true, state: { justVerified: true } })
        return
      }
      setSuccessMessage(res.message)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Verification failed')
    }
  })

  return (
    <AuthScreenShell
      title="Verify your email"
      subtitle="We sent a 6-digit code to your inbox. Enter it below to activate your account."
      backTo={fromLogin ? '/login' : '/'}
    >
      <AuthFormCard>
        {successMessage ? (
          <div className="flex flex-col gap-6 text-center">
            <p className="text-base leading-relaxed text-emerald-300 sm:text-sm">
              {successMessage}
            </p>
            <Link to="/login" className={btnPrimary}>
              Sign in
            </Link>
          </div>
        ) : (
          <>
            {fromLogin ? (
              <p
                className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm leading-snug text-amber-100"
                role="status"
              >
                One more step before you sign in. Enter the 6-digit code from your
                inbox and we will finish setting up your account.
              </p>
            ) : null}
            {emailDeliveryFailed ? (
              <p
                className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-3 text-sm leading-snug text-red-200"
                role="alert"
              >
                Your account was created, but we couldn&apos;t deliver the verification
                email just now. Tap &quot;Resend code&quot; below in a moment.
              </p>
            ) : null}
            <form className="flex flex-col gap-5 sm:gap-4" onSubmit={onSubmit} noValidate>
            {formError ? (
              <p
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm leading-snug text-red-200"
                role="alert"
              >
                {formError}
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
              label="Verification code"
              leftIcon="tag"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              enterKeyHint="done"
              maxLength={6}
              placeholder="000000"
              autoFocus={!!emailFromQuery}
              error={errors.code?.message}
              {...register('code')}
            />

            <button type="submit" disabled={isSubmitting} className={btnPrimary}>
              {isSubmitting ? 'Verifying…' : 'Verify email'}
            </button>

            {resendMessage ? (
              <p
                className="text-center text-sm leading-snug text-emerald-300/95"
                role="status"
              >
                {resendMessage}
              </p>
            ) : null}
            {resendError ? (
              <p
                className="text-center text-sm leading-snug text-red-200"
                role="alert"
              >
                {resendError}
              </p>
            ) : null}

            <div className="text-center">
              <button
                type="button"
                onClick={onResend}
                disabled={
                  isResending ||
                  isSubmitting ||
                  (resendCooldownUntil != null && resendCooldownSeconds > 0)
                }
                className="text-sm font-semibold text-[#FFD54A] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline"
              >
                {isResending
                  ? 'Sending…'
                  : resendCooldownSeconds > 0
                    ? `Resend code (${resendCooldownSeconds}s)`
                    : 'Resend code'}
              </button>
            </div>
          </form>
          </>
        )}

        {!successMessage ? (
          <p className="mt-6 text-center text-sm text-white/60">
            Wrong inbox?{' '}
            <Link
              to="/support"
              className="font-semibold text-[#FFD54A] underline-offset-2 hover:underline"
            >
              Get help
            </Link>
          </p>
        ) : null}
      </AuthFormCard>
    </AuthScreenShell>
  )
}
