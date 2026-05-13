import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { trackPageView } from '../../services/analyticsTracker'
import { useAuthStore } from '../../stores/authStore'
import { DrawerProfileSection, HeaderProfileMenu } from './ProfileMenu'
import { Footer } from './Footer'
import { UnverifiedEmailBanner } from './UnverifiedEmailBanner'

const UserChatWidget = lazy(() =>
  import('../chat/UserChatWidget').then((mod) => ({ default: mod.UserChatWidget })),
)

function RoutePendingFallback() {
  return (
    <div
      className="flex flex-1 shrink-0 flex-col items-center justify-center py-24"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div
        className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-[#FFD54A]/25 border-t-[#FFD54A]"
        aria-hidden
      />
    </div>
  )
}

/** Rising star mark for RSFGaming */
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

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  )
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  )
}

function IconGift({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  )
}

function IconCog({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.896 3.288a1.125 1.125 0 0 1-.26 1.437l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.437l-1.897 3.288a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.897-3.288a1.125 1.125 0 0 1 .26-1.437l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.437l1.897-3.288a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.075-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  )
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091a.75.75 0 0 1-1.5 0v-2.403c-3.13-.066-5.79-1.12-7.28-2.634a.75.75 0 0 1-.322-.484 6.75 6.75 0 0 1-.75-3.03 6.75 6.75 0 0 1 .75-3.03.75.75 0 0 1 .322-.484C5.21 4.36 8.87 3.306 12 3.24v-.001c3.13.066 5.79 1.12 7.28 2.634a.75.75 0 0 1 .322.484 6.75 6.75 0 0 1 .75 3.03 6.75 6.75 0 0 1-.75 3.03.75.75 0 0 1-.322.484C17.79 18.64 14.13 19.694 11 19.76v.001"
      />
    </svg>
  )
}

const mobileNavItems: {
  to: string
  label: string
  end?: boolean
  Icon: typeof IconHome
}[] = [
  { to: '/', label: 'Home', end: true, Icon: IconHome },
  { to: '/bonuses', label: 'Bonuses', Icon: IconGift },
  { to: '/platforms', label: 'Platforms', Icon: IconCog },
  { to: '/chat', label: 'Chat', Icon: IconChat },
]

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'font-display flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2 font-bold transition-colors',
    isActive
      ? 'border border-[#FFD54A]/90 bg-yellow-400/10 text-[#FFD54A] shadow-[0_0_20px_rgba(250,204,21,0.2)]'
      : 'border border-transparent text-white/75',
  ].join(' ')

const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
  [
    'font-display whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-bold transition-colors lg:px-3 lg:text-sm',
    isActive
      ? 'bg-yellow-400/10 text-[#FFD54A]'
      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white',
  ].join(' ')

const drawerNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'font-display block rounded-lg px-4 py-3 font-semibold text-neutral-200 transition hover:bg-white/[0.06]',
    isActive ? 'border-l-2 border-[#FFD54A] bg-yellow-400/10 font-bold text-[#FFD54A]' : '',
  ].join(' ')

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const mainScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])

  useLayoutEffect(() => {
    mainScrollRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [location.pathname])

  const isChatPage = location.pathname === '/chat'
  const isVerifyEmailPage = location.pathname === '/verify-email'
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password' ||
    location.pathname === '/verify-email'
  const isBonusesOrPlatformsPage =
    location.pathname === '/bonuses' ||
    location.pathname === '/platforms'
  const showFooter =
    !isChatPage && !isAuthPage && !isBonusesOrPlatformsPage
  const showVerifyBanner = !!user && !user.isEmailVerified && !isChatPage && !isVerifyEmailPage

  const authActions = user ? (
    <div className="flex max-w-full items-center justify-end">
      <HeaderProfileMenu user={user} />
    </div>
  ) : (
    <div className="flex max-w-[min(100%,9.5rem)] shrink-0 flex-wrap justify-end gap-1 sm:max-w-none sm:gap-2">
      <Link
        to="/login"
        className="btn-glow touch-manipulation rounded-lg bg-[#FFD54A] px-2 py-2 text-[11px] font-bold leading-none text-black transition hover:bg-[#F5C73A] sm:px-3 sm:text-xs md:text-sm"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="btn-glow touch-manipulation rounded-lg bg-[#FFD54A] px-2 py-2 text-[11px] font-bold leading-none text-black transition hover:bg-[#F5C73A] sm:px-3 sm:text-xs md:text-sm"
      >
        Sign up
      </Link>
    </div>
  )

  return (
    <div
      className={`flex flex-col bg-[#0B1020] text-neutral-100 ${
        isChatPage ? 'h-dvh max-h-dvh overflow-hidden' : 'h-dvh max-h-dvh min-h-0 overflow-hidden'
      }`}
    >
      <header className="sticky top-0 z-40 shrink-0 border-b border-neutral-800/90 bg-[#0B1020]/80 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_rgba(255,255,255,0.03)] backdrop-blur backdrop-saturate-150">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-3 py-2.5 sm:gap-2 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center justify-start gap-3">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-white md:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <NavLink
              to="/"
              className="hidden items-center gap-2 md:flex"
              end
            >
              <LogoMark className="h-9 w-9 shrink-0" />
              <span className="font-display text-xl font-extrabold tracking-tight text-white lg:text-2xl">
                RSFGaming
              </span>
            </NavLink>
          </div>

          <div className="flex min-w-0 justify-center">
            <NavLink
              to="/"
              className="flex max-w-[min(100%,11rem)] items-center gap-1.5 md:hidden"
              end
            >
              <LogoMark className="h-8 w-8 shrink-0" />
              <span className="font-display truncate text-lg font-extrabold tracking-tight text-white sm:text-xl">
                RSFGaming
              </span>
            </NavLink>
            <nav
              className="hidden max-w-full flex-wrap items-center justify-center gap-0.5 overflow-x-auto md:flex md:justify-center lg:gap-1.5"
              aria-label="Main"
            >
              <NavLink to="/" className={desktopNavClass} end>
                Home
              </NavLink>
              <NavLink to="/bonuses" className={desktopNavClass}>
                Bonuses
              </NavLink>
              <NavLink to="/platforms" className={desktopNavClass}>
                Platforms
              </NavLink>
              <NavLink to="/about" className={desktopNavClass}>
                About us
              </NavLink>
              <NavLink to="/support" className={desktopNavClass}>
                Support
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center justify-end gap-2">{authActions}</div>
        </div>
      </header>

      {/* Slide-over menu (mobile) */}
      {menuOpen ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(100%,18rem)] flex-col border-r border-white/[0.06] bg-[#0E1525] p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-white">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                aria-label="Close"
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <nav
              className="flex flex-col gap-1"
              aria-label="Site pages"
              onClick={() => setMenuOpen(false)}
            >
              <NavLink to="/" className={drawerNavLinkClass} end>
                Home
              </NavLink>
              <NavLink to="/bonuses" className={drawerNavLinkClass}>
                Bonuses
              </NavLink>
              <NavLink to="/platforms" className={drawerNavLinkClass}>
                Platforms
              </NavLink>
              <NavLink to="/about" className={drawerNavLinkClass}>
                About us
              </NavLink>
              <NavLink to="/support" className={drawerNavLinkClass}>
                Support
              </NavLink>
              <Link
                to="/privacy"
                className="block rounded-lg px-4 py-3 text-neutral-200 transition hover:bg-neutral-800"
                onClick={() => setMenuOpen(false)}
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="block rounded-lg px-4 py-3 text-neutral-200 transition hover:bg-neutral-800"
                onClick={() => setMenuOpen(false)}
              >
                Terms of Service
              </Link>
            </nav>
            <div className="mt-auto border-t border-white/10 pt-4">
              {user ? (
                <DrawerProfileSection
                  user={user}
                  onClose={() => setMenuOpen(false)}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="rounded-lg bg-[#FFD54A] py-3 text-center text-sm font-bold text-black"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg border border-[#FFD54A]/50 py-3 text-center text-sm font-semibold text-[#FFD54A]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div
        ref={mainScrollRef}
        className={`flex min-h-0 flex-1 flex-col overflow-x-hidden pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 ${
          isChatPage ? 'overflow-hidden' : 'overflow-y-auto overscroll-y-contain'
        }`}
      >
        {showVerifyBanner && user ? <UnverifiedEmailBanner user={user} /> : null}
        <Suspense fallback={<RoutePendingFallback />}>
          <Outlet />
        </Suspense>
        {showFooter ? <Footer /> : null}
      </div>

      {location.pathname !== '/chat' ? (
        <Suspense fallback={null}>
          <UserChatWidget variant="fab" />
        </Suspense>
      ) : null}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800/80 bg-black/90 pb-[env(safe-area-inset-bottom,0px)] pt-1.5 backdrop-blur-lg md:hidden"
        aria-label="Mobile primary"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2">
          {mobileNavItems.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={mobileNavLinkClass}
            >
              <Icon className="h-6 w-6 shrink-0" />
              <span className="max-w-[4.5rem] truncate text-center text-[11px] font-bold leading-tight">
                {label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
