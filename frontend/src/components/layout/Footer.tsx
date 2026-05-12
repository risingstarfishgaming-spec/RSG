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
      <h4 className="mb-4 text-sm font-semibold text-neutral-200">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-sm text-neutral-400 transition hover:text-[#FFD54A]"
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
    <footer className="mt-auto bg-[#080E1A] pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <div className="mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-[#FFD54A]/20 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="mb-4 inline-flex items-center gap-2.5">
              <LogoMark className="h-8 w-8" />
              <span className="text-lg font-bold text-neutral-100">RSFGaming</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-400">
              A premium gaming community platform offering trusted support,
              fast recharges, and a welcoming player experience.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-neutral-400 transition hover:border-[#FFD54A]/30 hover:text-[#FFD54A]"
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

      <div className="border-t border-white/[0.05] py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Rising Star Fish Gaming. All rights reserved.
      </div>
    </footer>
  )
}
