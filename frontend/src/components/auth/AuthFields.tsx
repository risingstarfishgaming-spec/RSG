import { useState, type ComponentProps, type ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import {
  IconEnvelope,
  IconEye,
  IconEyeSlash,
  IconLock,
  IconPhone,
  IconTag,
  IconUser,
} from './AuthIcons'

const fieldShell =
  'flex w-full min-h-12 items-stretch overflow-hidden rounded-2xl border border-white/10 bg-black/35 text-base text-white transition focus-within:border-[#FFD54A]/45 focus-within:ring-1 focus-within:ring-[#FFD54A]/20'
const fieldShellError = 'border-red-500/45 focus-within:border-red-500/50 focus-within:ring-red-500/15'
const iconBox =
  'flex w-11 shrink-0 items-center justify-center border-r border-white/[0.06] text-neutral-500 focus-within:text-[#FFD54A]/80'

type IconName = 'user' | 'email' | 'phone' | 'tag'

function LeftIcon({ name }: { name: IconName }) {
  const c = 'h-5 w-5'
  if (name === 'user') return <IconUser className={c} />
  if (name === 'email') return <IconEnvelope className={c} />
  if (name === 'phone') return <IconPhone className={c} />
  return <IconTag className={c} />
}

type TextFieldProps = {
  label: ReactNode
  error?: string
  leftIcon: IconName
} & ComponentProps<'input'>

export function AuthTextField({
  label,
  error,
  leftIcon,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <div className="w-full">
      <span className="mb-1.5 block text-left text-xs font-medium leading-snug text-neutral-400">
        {label}
      </span>
      <div className={`${fieldShell} ${error ? fieldShellError : ''}`}>
        <span className={iconBox} aria-hidden>
          <LeftIcon name={leftIcon} />
        </span>
        <input
          className={`min-w-0 flex-1 bg-transparent px-3 py-3 text-base placeholder:text-neutral-600 outline-none ${className ?? ''}`}
          {...inputProps}
        />
      </div>
      {error ? (
        <span className="mt-1.5 block text-sm text-red-400/95 sm:text-xs">
          {error}
        </span>
      ) : null}
    </div>
  )
}

type PasswordFieldProps = {
  label: ReactNode
  error?: string
  registration: UseFormRegisterReturn
  /** Optional helper text shown below the field (e.g. password rules). */
  hint?: ReactNode
} & Pick<
  ComponentProps<'input'>,
  'autoComplete' | 'enterKeyHint' | 'placeholder' | 'autoFocus'
>

export function AuthPasswordField({
  label,
  error,
  registration,
  autoComplete,
  enterKeyHint,
  placeholder,
  autoFocus,
  hint,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="w-full">
      <span className="mb-1.5 block text-left text-xs font-medium leading-snug text-neutral-400">
        {label}
      </span>
      <div className={`${fieldShell} ${error ? fieldShellError : ''}`}>
        <span className={iconBox} aria-hidden>
          <IconLock className="h-5 w-5" />
        </span>
        <input
          type={show ? 'text' : 'password'}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base placeholder:text-neutral-600 outline-none"
          autoComplete={autoComplete}
          enterKeyHint={enterKeyHint}
          placeholder={placeholder}
          autoFocus={autoFocus}
          {...registration}
        />
        <button
          type="button"
          className="flex w-11 shrink-0 touch-manipulation items-center justify-center text-neutral-500 transition hover:text-[#FFD54A]/90"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          {show ? (
            <IconEyeSlash className="h-5 w-5" />
          ) : (
            <IconEye className="h-5 w-5" />
          )}
        </button>
      </div>
      {hint && !error ? (
        <span className="mt-1.5 block text-xs leading-snug text-neutral-500">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="mt-1.5 block text-sm text-red-400/95 sm:text-xs">
          {error}
        </span>
      ) : null}
    </div>
  )
}
