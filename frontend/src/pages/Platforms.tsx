import { useEffect, useState } from 'react'
import { PageHero } from '../components/page/PageHero'
import { CatalogGridSkeleton } from '../components/ui/CatalogGridSkeleton'
import {
  fetchPublicPlatforms,
  type PublicPlatform,
} from '../services/cmsPublicApi'

export default function Platforms() {
  const [platforms, setPlatforms] = useState<PublicPlatform[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await fetchPublicPlatforms()
        if (!cancelled) {
          setPlatforms(data)
          setError(null)
        }
      } catch {
        if (!cancelled) {
          setError('Could not load platforms. Try again later.')
          setPlatforms([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [retryKey])

  return (
    <main className="bg-[#0a0a0b]">
      <PageHero
        eyebrow="Catalog"
        title="Platforms"
        description="Partner destinations curated by RSFGaming—published from your admin dashboard."
      />

      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FFD700]">
              Partners
            </p>
            <h2 className="font-display mt-2 text-2xl font-normal text-white sm:text-3xl md:text-4xl">
              Explore the lineup
            </h2>
          </div>

          {loading ? (
            <CatalogGridSkeleton />
          ) : error ? (
            <div className="mt-12 flex flex-col items-center gap-4">
              <p className="text-center text-sm text-red-400">{error}</p>
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-[#FFD700]/40 hover:text-[#FFD700]"
              >
                Try again
              </button>
            </div>
          ) : platforms.length === 0 ? (
            <p className="mt-12 text-center text-sm text-neutral-500">
              No platforms yet. Add some from the admin console.
            </p>
          ) : (
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {platforms.map((p) => (
                <li key={p._id}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-transparent transition hover:-translate-y-0.5 hover:border-[#FFD700]/35 hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                    {p.image ? (
                      <div className="aspect-[16/9] w-full overflow-hidden bg-black/40">
                        <img
                          src={p.image}
                          alt={p.name ? `${p.name} artwork` : 'Platform'}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-6">
                      <span className="inline-flex w-fit rounded-lg bg-[#FFD700]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FFD700]">
                        Partner
                      </span>
                      <h3 className="mt-5 text-lg font-semibold text-white sm:text-xl">
                        {p.name}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-400">
                        {p.description}
                      </p>
                      {p.gameLink?.trim() ? (
                        <a
                          href={p.gameLink.trim()}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-6 block w-full rounded-xl border border-white/15 py-2.5 text-center text-sm font-semibold text-white transition hover:border-[#FFD700]/50 hover:text-[#FFD700]"
                        >
                          Open platform
                        </a>
                      ) : (
                        <p className="mt-6 rounded-xl border border-dashed border-white/10 py-2.5 text-center text-sm text-neutral-500">
                          Link coming soon
                        </p>
                      )}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
