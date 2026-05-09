import type { ReactNode } from 'react'
import { InnerPageHeroBg } from './InnerPageHeroBg'
import { RsBrandBadge } from './RsBrandBadge'
import { WaveToDark } from './WaveToDark'

type Props = {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  /** Default true — inner pages show RSFGaming pill */
  showBadge?: boolean
}

export function PageHero({
  eyebrow,
  title,
  description,
  showBadge = true,
}: Props) {
  return (
    <section className="relative overflow-hidden pb-0">
      <InnerPageHeroBg />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-12 text-center sm:px-6 sm:pb-16 sm:pt-16">
        {showBadge ? <RsBrandBadge /> : null}
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/75 sm:text-sm sm:tracking-[0.4em]">
          {eyebrow}
        </p>
        <h1
          className={
            typeof title === 'string'
              ? 'font-display mt-4 text-[clamp(2rem,6vw,3.25rem)] font-normal leading-tight tracking-tight'
              : 'font-display mt-4 leading-none'
          }
        >
          {typeof title === 'string' ? (
            <span className="text-gold-gradient drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
              {title}
            </span>
          ) : (
            title
          )}
        </h1>
        {description ? (
          <div className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            {description}
          </div>
        ) : null}
      </div>
      <WaveToDark />
    </section>
  )
}
