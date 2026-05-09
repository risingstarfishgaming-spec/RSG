import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { AuthTextField } from '../components/auth/AuthFields'
import { AuthScreenShell } from '../components/auth/AuthScreenShell'
import { requestPasswordReset } from '../services/authApi'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

const btnPrimary =
  'flex min-h-12 w-full touch-manipulation items-center justify-center rounded-2xl bg-[#FFD700] px-4 py-3.5 text-base font-bold text-neutral-950 shadow-[0_8px_28px_rgba(255,215,0,0.2)] transition hover:bg-[#f5cc00] active:bg-[#e6bd00] disabled:cursor-not-allowed disabled:opacity-50'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null)
    setDoneMessage(null)
    try {
      await requestPasswordReset(email)
      setDoneMessage(
        'Code sent. Redirecting you to enter the code and your new password…',
      )
      setTimeout(() => {
        navigate(
          `/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`,
          { replace: true },
        )
      }, 800)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Request failed')
    }
  })

  return (
    <AuthScreenShell
      title="Forgot password"
      subtitle="Enter the email for your account. If it exists, we will send a 6-digit code to reset your password."
      backTo="/login"
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
          {doneMessage ? (
            <p
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm leading-snug text-emerald-200"
              role="status"
            >
              {doneMessage}
            </p>
          ) : null}

          <AuthTextField
            label="Email address"
            leftIcon="email"
            type="email"
            autoComplete="email"
            enterKeyHint="done"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <button
            type="submit"
            disabled={isSubmitting || !!doneMessage}
            className={btnPrimary}
          >
            {isSubmitting ? 'Sending…' : 'Continue'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500">
          Remember your password?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#FFD700] underline-offset-2 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </AuthFormCard>
    </AuthScreenShell>
  )
}
