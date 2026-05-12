import type { ReactNode } from 'react'
import {
  CheckCircle2,
  Crown,
  Dices,
  Fish,
  Gamepad2,
  Gift,
  Handshake,
  Headphones,
  Heart,
  Rocket,
  Scale,
  Sparkles,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { PageHero } from '../components/page/PageHero'
import { PageCtaBand } from '../components/page/PageCtaBand'

type IconType = (props: { className?: string }) => ReactNode

const offerings: { icon: IconType; title: string; description: string }[] = [
  {
    icon: Fish,
    title: 'Fish Games',
    description:
      'Fast, vibrant shooter-style fish rooms with progressive jackpots and tournament events.',
  },
  {
    icon: Dices,
    title: 'Slot Games',
    description:
      'A wide library of slots—classic reels, modern video slots, and feature-rich bonus rounds.',
  },
  {
    icon: Gamepad2,
    title: 'Arcade Games',
    description:
      'Skill-based arcade titles for quick sessions and high-energy competitive play.',
  },
  {
    icon: Crown,
    title: 'Casino Style Entertainment',
    description:
      'Casino-style table experiences delivered with polished visuals and dependable fairness.',
  },
  {
    icon: Gift,
    title: 'Reward Events & Promotions',
    description:
      'Frequent events, loyalty perks, and seasonal promotions that reward consistent play.',
  },
]

const differentiators: { icon: IconType; title: string; description: string }[] = [
  {
    icon: Zap,
    title: 'Fast & secure recharges',
    description:
      'Quick top-ups protected end-to-end so you can get back to playing without friction.',
  },
  {
    icon: Wallet,
    title: 'Smooth withdrawal processing',
    description:
      'Clear timelines and consistent payouts—your winnings move when they should.',
  },
  {
    icon: Headphones,
    title: 'Reliable customer support',
    description:
      'A dedicated team that answers quickly and follows through until you are sorted.',
  },
  {
    icon: Scale,
    title: 'Fair & enjoyable gameplay',
    description:
      'Transparent rules, certified providers, and a culture of fair play across every title.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe & protected experience',
    description:
      'Account hardening, encrypted sessions, and strict data handling at every step.',
  },
  {
    icon: Sparkles,
    title: 'Active engagement & rewards',
    description:
      'Recurring events and bonuses keep the community lively and our regulars rewarded.',
  },
]

const commitments: { icon: IconType; title: string }[] = [
  { icon: ShieldCheck, title: 'Account security' },
  { icon: Scale, title: 'Fair play' },
  { icon: Handshake, title: 'Reliable service' },
  { icon: TrendingUp, title: 'Continuous platform improvement' },
  { icon: Users, title: 'Community growth & engagement' },
]

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FFD54A]">
      {children}
    </p>
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display mt-2 text-2xl font-normal text-white sm:text-3xl md:text-4xl">
      {children}
    </h2>
  )
}

export default function AboutUs() {
  return (
    <main className="bg-[#0B1020]">
      <PageHero
        eyebrow="About us"
        title="Rising Star Fish Gaming"
        description="A growing online gaming community built for players who seek entertainment, excitement, and a reliable gaming experience."
      />

      {/* Intro */}
      <section className="border-b border-white/[0.06] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-6 text-base leading-relaxed text-neutral-300 sm:text-[17px]">
          <p>
            Welcome to{' '}
            <span className="font-semibold text-white">
              Rising Star Fish Gaming
            </span>{' '}
            — a growing online gaming community built for players who seek
            entertainment, excitement, and a reliable gaming experience.
          </p>
          <p className="text-neutral-400">
            At Rising Star Fish Gaming, we believe online gaming should be more
            than just playing games — it should be about creating enjoyable
            moments, building a trusted community, and delivering a platform
            where players can feel confident, secure, and valued every day.
          </p>
          <p className="text-neutral-400">
            Founded with the vision of providing high-quality gaming services
            and professional customer support, Rising Star Fish Gaming has
            continued to grow by focusing on what matters most:{' '}
            <span className="text-neutral-200">player satisfaction</span>,{' '}
            <span className="text-neutral-200">smooth gameplay</span>,{' '}
            <span className="text-neutral-200">secure transactions</span>, and{' '}
            <span className="text-neutral-200">long-term trust</span>.
          </p>
        </div>
      </section>

      {/* What we offer */}
      <section className="border-b border-white/[0.06] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <SectionEyebrow>What we offer</SectionEyebrow>
            <SectionHeading>A platform built for play</SectionHeading>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              Our platform offers a wide range of exciting entertainment
              options, designed to be fast, secure, and enjoyable for casual
              players and dedicated regulars alike.
            </p>
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <article className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-6 transition hover:-translate-y-0.5 hover:border-[#FFD54A]/35 hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-7">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFD54A]/15 text-[#FFD54A] ring-1 ring-[#FFD54A]/25">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white sm:text-xl">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    {description}
                  </p>
                </article>
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-neutral-400 sm:text-base">
            We are committed to maintaining a fast, secure, and user-friendly
            environment for all players. Whether you are a casual gamer looking
            for fun or a dedicated player seeking thrilling competition and
            rewards, Rising Star Fish Gaming is designed to provide an enjoyable
            experience for everyone.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="border-b border-white/[0.06] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <SectionEyebrow>Our mission</SectionEyebrow>
              <SectionHeading>
                Trusted gaming, made simple
              </SectionHeading>
              <div className="mt-6 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD54A]/15 text-[#FFD54A] ring-1 ring-[#FFD54A]/25">
                  <Target className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-300">
                  Play, relax, repeat
                </p>
              </div>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-neutral-400 sm:text-[17px]">
              <p>
                Our mission is to create a trusted online gaming platform that
                combines{' '}
                <span className="text-neutral-200">entertainment</span>,{' '}
                <span className="text-neutral-200">innovation</span>, and{' '}
                <span className="text-neutral-200">excellent customer service</span>
                . We aim to provide a smooth and enjoyable experience where
                players can relax, have fun, and enjoy high-quality gaming
                anytime and anywhere.
              </p>
              <p>
                We continuously work on improving our services, expanding our
                gaming options, and maintaining a professional support system
                to ensure our users always receive the best experience
                possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What makes us different */}
      <section className="border-b border-white/[0.06] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <SectionEyebrow>What makes us different</SectionEyebrow>
            <SectionHeading>Built on trust and service</SectionHeading>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              At Rising Star Fish Gaming, we understand that trust and service
              are the foundation of every successful gaming platform. That is
              why we focus on the things that genuinely matter to players.
            </p>
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <article className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition hover:border-white/15 hover:bg-white/[0.04] sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-[#FFD54A] ring-1 ring-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold text-white sm:text-lg">
                      {title}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                    {description}
                  </p>
                </article>
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-neutral-400 sm:text-base">
            Our support team is dedicated to assisting players with
            professionalism and care. We value every member of our community
            and always strive to respond quickly and effectively to ensure
            player satisfaction.
          </p>
        </div>
      </section>

      {/* Our commitment */}
      <section className="border-b border-white/[0.06] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <SectionEyebrow>Our commitment</SectionEyebrow>
            <SectionHeading>Responsible, secure, entertaining</SectionHeading>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              Rising Star Fish Gaming is committed to creating a responsible,
              secure, and entertaining gaming environment.
            </p>
          </div>

          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {commitments.map(({ icon: Icon, title }) => (
              <li
                key={title}
                className="flex items-center gap-3 rounded-2xl border border-[#FFD54A]/15 bg-gradient-to-r from-[#FFD54A]/[0.05] to-transparent px-5 py-4"
              >
                <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFD54A]/15 text-[#FFD54A] ring-1 ring-[#FFD54A]/25">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-white sm:text-base">
                  {title}
                </span>
                <CheckCircle2 className="ml-auto h-4 w-4 text-[#FFD54A]/70" />
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-neutral-400 sm:text-base">
            As the online gaming industry continues to evolve, we aim to grow
            alongside our players by introducing better features, exciting
            promotions, and an even stronger gaming experience in the future.
          </p>
        </div>
      </section>

      {/* Join community */}
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div className="space-y-5 text-base leading-relaxed text-neutral-400 sm:text-[17px]">
              <SectionEyebrow>Join our growing community</SectionEyebrow>
              <SectionHeading>
                Built around the people who play
              </SectionHeading>
              <p>
                Many players choose gaming platforms not only for entertainment
                but also for{' '}
                <span className="text-neutral-200">trust</span>,{' '}
                <span className="text-neutral-200">stability</span>, and{' '}
                <span className="text-neutral-200">support</span>. Rising Star
                Fish Gaming is proud to build a community where players can
                enjoy games confidently while being supported by a dedicated
                and professional team.
              </p>
              <p>
                Whether you are here to enjoy fish games, explore exciting
                slots, participate in events, or simply experience quality
                online entertainment — Rising Star Fish Gaming welcomes you.
              </p>
              <p className="text-neutral-300">
                Thank you for being part of our journey.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-[#FFD54A]/25 bg-gradient-to-br from-[#0B1020] via-[#151D31] to-[#0B1020] p-8 text-center shadow-[0_0_80px_rgba(255,213,74,0.08)] sm:p-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                aria-hidden
              >
                <div className="absolute -left-8 top-0 h-32 w-32 rounded-full bg-[#FFD54A] blur-[90px]" />
                <div className="absolute -bottom-8 right-0 h-28 w-28 rounded-full bg-amber-600 blur-[70px]" />
              </div>
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFD54A]/20 text-[#FFD54A] ring-1 ring-[#FFD54A]/30">
                <Star className="h-6 w-6" />
              </span>
              <p className="relative mt-5 text-xs font-bold uppercase tracking-[0.3em] text-[#FFD54A]">
                Rising Star Fish Gaming
              </p>
              <h3 className="font-display relative mt-3 text-2xl font-normal leading-tight text-white sm:text-3xl">
                Play Smart.
                <br />
                Play Safe.
                <br />
                Rise Like a Star.
              </h3>
              <div className="relative mt-6 flex items-center justify-center gap-2 text-neutral-300">
                <Heart className="h-4 w-4 text-[#FFD54A]/80" />
                <span className="text-sm">A community made for you</span>
                <Rocket className="h-4 w-4 text-[#FFD54A]/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageCtaBand
        title="Ready to dive in?"
        description="Browse the catalog, claim a bonus, or reach out to support—your journey with Rising Star Fish Gaming starts here."
        primary={{ to: '/platforms', label: 'Explore platforms' }}
        secondary={{ to: '/support', label: 'Contact support' }}
      />
    </main>
  )
}
