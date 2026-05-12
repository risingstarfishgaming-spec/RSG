import { Headphones, ShieldCheck, Users, Clock } from 'lucide-react'

const items = [
  { Icon: Headphones, label: 'Fast Support', desc: 'Quick and reliable help' },
  { Icon: ShieldCheck, label: 'Secure Transactions', desc: 'Your data stays safe' },
  { Icon: Users, label: 'Trusted Community', desc: 'Thousands of active players' },
  { Icon: Clock, label: '24/7 Assistance', desc: 'We are always available' },
] as const

export function TrustBar() {
  return (
    <section className="px-4 sm:px-6">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {items.map(({ Icon, label, desc }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center transition hover:border-white/[0.12] hover:bg-white/[0.04] sm:py-7"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
              <Icon className="h-5 w-5 text-[#FFD54A]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-100">{label}</p>
              <p className="mt-0.5 text-xs text-neutral-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
