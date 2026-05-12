import { Link } from 'react-router'
import { Globe, MessageCircle, Send, Heart } from 'lucide-react'

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="16" cy="16" r="14" className="fill-neutral-900 stroke-[#FFD54A]/80" strokeWidth="1.5" />
      <path
        className="fill-[#FFD54A]"
        d="M16 6l1.8 5.5h5.8l-4.7 3.4 1.8 5.5L16 17l-4.7 3.4 1.8-5.5-4.7-3.4h5.8L16 6z"
      />
    </svg>
  )
}

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Games', to: '/games' },
  { label: 'Platforms', to: '/platforms' },
  { label: 'Bonuses', to: '/bonuses' },
]

const supportLinks = [
  { label: 'Contact Support', to: '/support' },
  { label: 'About Us', to: '/about' },
  { label: 'Live Chat', to: '/chat' },
]

const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
]

const socials = [
  { Icon: Globe, href: '#', label: 'Facebook' },
  { Icon: MessageCircle, href: '#', label: 'Discord' },
  { Icon: Send, href: '#', label: 'Telegram' },
  { Icon: Heart, href: '#', label: 'Community' },
]

function FooterLinkGroup({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="mb-2.5 text-xs font-semibold text-neutral-200 sm:mb-3 sm:text-sm">{title}</h4>
      <ul className="space-y-2 sm:space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-xs text-neutral-400 transition hover:text-[#FFD54A] sm:text-sm"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto bg-[#080E1A]">
      <div className="mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-[#FFD54A]/20 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="mb-3 inline-flex items-center gap-2 sm:mb-4">
              <LogoMark className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="text-base font-bold text-neutral-100 sm:text-lg">RSFGaming</span>
            </Link>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-400 sm:mt-3 sm:text-sm">
              A premium gaming community platform offering trusted support,
              fast recharges, and a welcoming player experience.
            </p>
            <div className="mt-4 flex items-center gap-2.5 sm:mt-5 sm:gap-3">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-neutral-400 transition hover:border-[#FFD54A]/30 hover:text-[#FFD54A] sm:h-9 sm:w-9"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterLinkGroup title="Quick Links" links={quickLinks} />
          <FooterLinkGroup title="Support" links={supportLinks} />
          <FooterLinkGroup title="Legal" links={legalLinks} />
        </div>
      </div>

      <div className="border-t border-white/[0.05] py-4 text-center text-[11px] text-neutral-500 sm:py-5 sm:text-xs">
        © {new Date().getFullYear()} Rising Star Fish Gaming. All rights reserved.
      </div>
    </footer>
  )
}
