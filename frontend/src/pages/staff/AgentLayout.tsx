import { useState } from 'react'
import {
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MessageCircle,
  PanelLeft,
  PanelLeftClose,
  UserPlus,
  Users,
  LogOut,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import type { StaffUser } from '../../types/staff'
import { agentCan } from '../../utils/agentPermissions'
import { agentSectionTitle } from './agentSectionTitle'

const navLinkClass = ({
  isActive,
  collapsed,
}: {
  isActive: boolean
  collapsed: boolean
}) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    collapsed ? 'justify-center' : ''
  } ${
    isActive
      ? 'bg-blue-600 text-white shadow-sm'
      : 'text-gray-300 hover:bg-gray-700/80 hover:text-white'
  }`

type NavItem = {
  to: string
  end?: boolean
  label: string
  Icon: typeof Users
  perm: 'always' | 'clients' | 'referrals' | 'support' | 'chat'
}

const NAV: NavItem[] = [
  { to: '/agent', end: true, label: 'Overview', Icon: LayoutDashboard, perm: 'always' },
  { to: '/agent/clients', label: 'Clients', Icon: Users, perm: 'clients' },
  { to: '/agent/referrals', label: 'Referrals', Icon: UserPlus, perm: 'referrals' },
  { to: '/agent/support', label: 'Support', Icon: LifeBuoy, perm: 'support' },
  { to: '/agent/chat', label: 'Live chat', Icon: MessageCircle, perm: 'chat' },
]

function SidebarNav({
  staff,
  collapsed,
  onNavigate,
}: {
  staff: StaffUser | null
  collapsed: boolean
  onNavigate?: () => void
}) {
  const visible = NAV.filter((item) => {
    if (item.perm === 'always') return true
    return agentCan(staff, item.perm)
  })

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {visible.map(({ to, end, label, Icon, perm }) => (
        <NavLink
          key={`${to}-${perm}`}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) => navLinkClass({ isActive, collapsed })}
        >
          <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
          {collapsed ? null : <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

function BottomNav({
  staff,
  onNavigate,
}: {
  staff: StaffUser | null
  onNavigate?: () => void
}) {
  const visible = NAV.filter((item) => {
    if (item.perm === 'always') return true
    return agentCan(staff, item.perm)
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-gray-200 bg-white/95 px-1 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-white/90 lg:hidden">
      {visible.map(({ to, end, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`
          }
        >
          <Icon className="h-5 w-5" aria-hidden />
          <span className="truncate px-0.5">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function AgentLayout() {
  const location = useLocation()
  const title = agentSectionTitle(location.pathname)
  const logout = useStaffAuthStore((s) => s.logout)
  const staff = useStaffAuthStore((s) => s.staff)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 overflow-hidden bg-gray-50">
      <button
        type="button"
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/50 transition lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-800 pt-[env(safe-area-inset-top,0px)] text-white shadow-xl transition-all duration-200 lg:static lg:z-0 lg:translate-x-0 lg:pt-0 lg:shadow-none ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-700/80 px-3 py-4">
          {!collapsed ? (
            <div className="min-w-0 pl-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                Agent
              </p>
              <p className="truncate text-sm text-gray-300">
                {staff?.firstName} {staff?.lastName}
              </p>
            </div>
          ) : (
            <span className="mx-auto text-[10px] font-bold uppercase tracking-widest text-blue-400">
              Ag
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav
            staff={staff}
            collapsed={collapsed}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>

        <div className="border-t border-gray-700/80 p-3">
          <button
            type="button"
            onClick={() => logout()}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            {collapsed ? null : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="min-w-0 flex-1 text-lg font-semibold tracking-tight text-gray-900">
            {title}
          </h1>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex max-w-[200px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-800 shadow-sm hover:bg-gray-50"
            >
              <span className="truncate">
                {staff?.firstName} {staff?.lastName}
              </span>
              <span className="text-gray-400">▾</span>
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <p className="truncate px-3 py-2 text-xs text-gray-500">
                    {staff?.email}
                  </p>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-y-auto p-4 pb-[max(4.5rem,calc(1rem+env(safe-area-inset-bottom,0px)))] sm:px-6 sm:pt-6 lg:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav
        staff={staff}
        onNavigate={() => setMobileOpen(false)}
      />
    </div>
  )
}
