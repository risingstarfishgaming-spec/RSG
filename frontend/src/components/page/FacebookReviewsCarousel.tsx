import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  FACEBOOK_REVIEWS_URL,
  facebookRecommendReviews,
} from '../../data/facebookReviews'

const ROTATE_MS = 7000

export function FacebookReviewsCarousel() {
  const [index, setIndex] = useState(0)
  const n = facebookRecommendReviews.length

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + n) % n)
    },
    [n],
  )

  useEffect(() => {
    if (n <= 1) return
    const t = window.setInterval(() => go(1), ROTATE_MS)
    return () => window.clearInterval(t)
  }, [go, n])

  const current = facebookRecommendReviews[index]

  return (
    <section
      className="border-t border-white/[0.06] bg-[#0B1020] px-4 py-12 sm:px-6 sm:py-16"
      aria-labelledby="facebook-reviews-heading"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2
            id="facebook-reviews-heading"
            className="font-display text-2xl font-semibold text-white sm:text-3xl md:text-4xl"
          >
            Reviews from Facebook
          </h2>
          <p className="mx-auto mt-2 text-sm text-neutral-500">
            From our{' '}
            <a
              href={FACEBOOK_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#FFD54A]/90 underline decoration-[#FFD54A]/40 underline-offset-2 transition hover:text-[#FFD54A]"
            >
              Facebook Page
            </a>
            .
          </p>
        </div>

        <div className="relative mt-10">
          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-6 py-10 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:px-10 sm:py-12">
            <div
              className="flex justify-center gap-0.5 text-[#FFD54A]"
              aria-hidden
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-lg leading-none sm:text-xl">
                  ★
                </span>
              ))}
            </div>

            <blockquote className="mt-6 min-h-[5.5rem] text-center sm:min-h-[4.5rem]">
              <p
                key={index}
                className="animate-fade-in text-base leading-relaxed text-neutral-200 sm:text-lg"
              >
                “{current.quote}”
              </p>
            </blockquote>

            <p className="mt-6 text-center text-sm font-semibold text-white">
              — {current.name}
            </p>
            <p className="mt-1 text-center text-xs text-neutral-500">
              Recommends Rising Star Fish Gaming
            </p>
          </div>

          {n > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0B1020]/95 text-white shadow-lg backdrop-blur-sm transition hover:border-[#FFD54A]/40 hover:bg-[#141416] sm:left-0 sm:h-11 sm:w-11 sm:-translate-x-3"
                aria-label="Previous review"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0B1020]/95 text-white shadow-lg backdrop-blur-sm transition hover:border-[#FFD54A]/40 hover:bg-[#141416] sm:right-0 sm:h-11 sm:w-11 sm:translate-x-3"
                aria-label="Next review"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </>
          ) : null}
        </div>

        {n > 1 ? (
          <div
            className="mt-6 flex justify-center gap-2"
            role="tablist"
            aria-label="Choose a review"
          >
            {facebookRecommendReviews.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? 'w-8 bg-[#FFD54A]'
                    : 'w-2 bg-white/20 hover:bg-white/35'
                }`}
                aria-label={`Show review ${i + 1} of ${n}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
