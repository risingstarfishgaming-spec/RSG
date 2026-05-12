import { Link } from 'react-router'

type Props = {
  title: string
  description: string
  primary: { to: string; label: string }
  secondary?: { to: string; label: string }
}

export function PageCtaBand({
  title,
  description,
  primary,
  secondary,
}: Props) {
  return (
    <section className="px-4 pb-20 pt-4 sm:px-6 sm:pb-28">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#FFD54A]/25 bg-gradient-to-r from-[#0B1020] via-[#151D31] to-[#0B1020] px-6 py-12 text-center shadow-[0_0_80px_rgba(255,213,74,0.1)] sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          aria-hidden
        >
          <div className="absolute left-1/4 top-0 h-32 w-32 rounded-full bg-[#FFD54A] blur-[90px]" />
          <div className="absolute bottom-0 right-1/4 h-28 w-28 rounded-full bg-amber-600 blur-[70px]" />
        </div>
        <h2 className="font-display relative text-xl font-semibold text-white sm:text-2xl md:text-3xl">
          {title}
        </h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-amber-100/75 sm:text-base">
          {description}
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            to={primary.to}
            className="btn-glow inline-flex items-center justify-center rounded-full bg-[#FFD54A] px-7 py-3 text-sm font-bold text-neutral-950 transition hover:bg-[#FFE17A]"
          >
            {primary.label}
          </Link>
          {secondary ? (
            <Link
              to={secondary.to}
              className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
