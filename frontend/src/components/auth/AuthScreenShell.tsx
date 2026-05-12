import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { InnerPageHeroBg } from '../page/InnerPageHeroBg'
import { IconArrowLeft } from './AuthIcons'

type Props = {
  title: string
  subtitle: string
  backTo?: string
  children: ReactNode
}

export function AuthScreenShell({
  title,
  subtitle,
  backTo = '/',
  children,
}: Props) {
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(backTo)
    }
  }

  return (
    <main className="relative isolate flex min-h-0 flex-1 flex-col overflow-x-hidden text-neutral-100">
      <div
        className="pointer-events-none absolute inset-0 -z-20 min-h-[calc(100dvh-5.5rem-env(safe-area-inset-top,0px))] w-full md:min-h-[calc(100dvh-4rem)]"
        aria-hidden
      >
        <div className="relative h-full min-h-[calc(100dvh-5.5rem-env(safe-area-inset-top,0px))] w-full md:min-h-[calc(100dvh-4rem)]">
          <InnerPageHeroBg />
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[#0a0a12]/75"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col px-4 pb-8 pt-2 sm:px-6 sm:pb-10 sm:pt-4">
        <div className="mb-2 flex shrink-0 items-center">
          <button
            type="button"
            onClick={goBack}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-white/20 bg-black/25 text-white/95 shadow-lg shadow-black/20 backdrop-blur-md transition hover:border-[#FFD54A]/40 hover:bg-[#FFD54A]/15 hover:text-[#FFD54A]"
            aria-label="Go back"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <h1 className="font-display text-center text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          <span className="text-gold-gradient drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
            {title}
          </span>
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-white/75 sm:text-[0.95rem]">
          {subtitle}
        </p>

        <div className="mt-6 flex-1 sm:mt-8">{children}</div>
      </div>
    </main>
  )
}
