import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { AuthPasswordField, AuthTextField } from '../components/auth/AuthFields'
import { AuthScreenShell } from '../components/auth/AuthScreenShell'
import { loginAccount, LoginError } from '../services/authApi'
import { useAuthStore } from '../stores/authStore'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const REMEMBER_KEY = 'rsfg_remember'
const EMAIL_KEY = 'rsfg_saved_email'

const btnPrimary =
  'btn-glow flex min-h-12 w-full touch-manipulation items-center justify-center rounded-2xl bg-[#FFD54A] px-4 py-3.5 text-base font-bold text-neutral-950 shadow-[0_8px_28px_rgba(255,213,74,0.2)] transition hover:bg-[#F5C73A] active:bg-[#E5B72F] disabled:cursor-not-allowed disabled:opacity-50'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [formError, setFormError] = useState<string | null>(null)
  const [remember, setRemember] = useState(false)

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/bonuses'

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    try {
      if (localStorage.getItem(REMEMBER_KEY) === '1') {
        const e = localStorage.getItem(EMAIL_KEY)
        if (e) setValue('email', e)
        setRemember(true)
      }
    } catch {
      /* ignore */
    }
  }, [setValue])

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null)
    try {
      const res = await loginAccount(data)
      setAuth(res.token, res.user)
      try {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, '1')
          localStorage.setItem(EMAIL_KEY, data.email)
        } else {
          localStorage.removeItem(REMEMBER_KEY)
          localStorage.removeItem(EMAIL_KEY)
        }
      } catch {
        /* ignore */
      }
      navigate(redirectTo, { replace: true })
    } catch (e) {
      if (
        e instanceof LoginError &&
        e.apiCode === 'EMAIL_NOT_VERIFIED'
      ) {
        navigate(
          `/verify-email?email=${encodeURIComponent(data.email.trim().toLowerCase())}`,
          { replace: true, state: { fromLogin: true } },
        )
        return
      }
      if (e instanceof LoginError && e.httpStatus === 429) {
        setFormError(
          'Too many sign-in attempts. Wait a few minutes, or reset your password if you forgot it.',
        )
        return
      }
      setFormError(e instanceof Error ? e.message : 'Sign in failed')
    }
  })

  const rateLimited = formError?.startsWith('Too many sign-in attempts')

  return (
    <AuthScreenShell
      title="Sign in"
      subtitle="Welcome back. Sign in to claim bonuses, chat with support, and manage your account."
      backTo="/"
    >
      <AuthFormCard>
        <form className="flex flex-col gap-5 sm:gap-4" onSubmit={onSubmit} noValidate>
          {formError ? (
            <div
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm leading-snug text-red-300"
              role="alert"
            >
              <p>{formError}</p>
              {rateLimited ? (
                <p className="mt-2">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-red-100 underline-offset-2 hover:underline"
                  >
                    Reset your password
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

          <AuthTextField
            label="Email address"
            leftIcon="email"
            type="email"
            autoComplete="email"
            enterKeyHint="next"
            placeholder="you@example.com"
            autoFocus
            error={errors.email?.message}
            {...register('email')}
          />

          <AuthPasswordField
            label="Password"
            registration={register('password')}
            autoComplete="current-password"
            enterKeyHint="done"
            placeholder="Enter password"
            error={errors.password?.message}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2.5 text-neutral-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(ev) => setRemember(ev.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-white/20 bg-black/50 accent-[#FFD54A]"
              />
              <span className="select-none">Remember my email on this device</span>
            </label>
            <Link
              to="/forgot-password"
              className="touch-manipulation font-semibold text-[#FFD54A] underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#FFD54A] underline-offset-2 hover:underline"
          >
            Create one
          </Link>
        </p>
      </AuthFormCard>
    </AuthScreenShell>
  )
}
