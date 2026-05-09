import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useStaffAuthStore } from '../stores/staffAuthStore'
import type { AgentPermission, StaffRole } from '../types/staff'
import { agentCan } from '../utils/agentPermissions'
import { RedirectToMainSite } from './RedirectToMainSite'

const AdminAgentsPage = lazy(() =>
  import('../pages/staff/AdminAgentsPage').then((m) => ({ default: m.AdminAgentsPage })),
)
const AdminBonusesPage = lazy(() =>
  import('../pages/staff/AdminBonusesPage').then((m) => ({ default: m.AdminBonusesPage })),
)
const AdminChatPage = lazy(() =>
  import('../pages/staff/AdminChatPage').then((m) => ({ default: m.AdminChatPage })),
)
const AdminPlatformsPage = lazy(() =>
  import('../pages/staff/AdminPlatformsPage').then((m) => ({ default: m.AdminPlatformsPage })),
)
const AdminAnalyticsPage = lazy(() =>
  import('../pages/staff/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage })),
)
const AdminDashboard = lazy(() =>
  import('../pages/staff/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)
const AdminLayout = lazy(() =>
  import('../pages/staff/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const AdminLogin = lazy(() =>
  import('../pages/staff/AdminLogin').then((m) => ({ default: m.AdminLogin })),
)
const AdminSmsPage = lazy(() =>
  import('../pages/staff/AdminSmsPage').then((m) => ({ default: m.AdminSmsPage })),
)
const AdminSupportPage = lazy(() =>
  import('../pages/staff/AdminSupportPage').then((m) => ({ default: m.AdminSupportPage })),
)
const AdminUsersPage = lazy(() =>
  import('../pages/staff/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AgentClientDetailPage = lazy(() =>
  import('../pages/staff/AgentClientDetailPage').then((m) => ({ default: m.AgentClientDetailPage })),
)
const AgentChatPage = lazy(() =>
  import('../pages/staff/AgentChatPage').then((m) => ({ default: m.AgentChatPage })),
)
const AgentClientsPage = lazy(() =>
  import('../pages/staff/AgentClientsPage').then((m) => ({ default: m.AgentClientsPage })),
)
const AgentDashboard = lazy(() =>
  import('../pages/staff/AgentDashboard').then((m) => ({ default: m.AgentDashboard })),
)
const AgentLayout = lazy(() =>
  import('../pages/staff/AgentLayout').then((m) => ({ default: m.AgentLayout })),
)
const AgentLogin = lazy(() =>
  import('../pages/staff/AgentLogin').then((m) => ({ default: m.AgentLogin })),
)
const AgentReferralsPage = lazy(() =>
  import('../pages/staff/AgentReferralsPage').then((m) => ({ default: m.AgentReferralsPage })),
)
const AgentSupportPage = lazy(() =>
  import('../pages/staff/AgentSupportPage').then((m) => ({ default: m.AgentSupportPage })),
)

function StaffRouteFallback() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="h-8 w-8 animate-spin text-indigo-300" />
    </div>
  )
}

function RequireStaffRole({ role }: { role: StaffRole }) {
  const token = useStaffAuthStore((s) => s.token)
  const staff = useStaffAuthStore((s) => s.staff)
  if (!token || !staff) {
    return (
      <Navigate
        to={role === 'admin' ? '/admin/login' : '/agent/login'}
        replace
      />
    )
  }
  if (staff.role !== role) {
    return (
      <Navigate
        to={staff.role === 'admin' ? '/admin' : '/agent'}
        replace
      />
    )
  }
  return <Outlet />
}

function RequireAgentPermission({
  perm,
  children,
}: {
  perm: AgentPermission
  children: ReactNode
}) {
  const staff = useStaffAuthStore((s) => s.staff)
  if (!agentCan(staff, perm)) {
    return (
      <Navigate
        to="/agent"
        replace
      />
    )
  }
  return <>{children}</>
}

export default function SuperStaffRoutes() {
  return (
    <Suspense fallback={<StaffRouteFallback />}>
      <Routes>
        <Route index element={<RedirectToMainSite />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="agent/login" element={<AgentLogin />} />

        <Route element={<RequireStaffRole role="admin" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="agents" element={<AdminAgentsPage />} />
            <Route path="platforms" element={<AdminPlatformsPage />} />
            <Route path="bonuses" element={<AdminBonusesPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="sms" element={<AdminSmsPage />} />
            <Route path="chat" element={<AdminChatPage />} />
          </Route>
        </Route>

        <Route element={<RequireStaffRole role="agent" />}>
          <Route path="agent" element={<AgentLayout />}>
            <Route index element={<AgentDashboard />} />
            <Route
              path="clients"
              element={
                <RequireAgentPermission perm="clients">
                  <AgentClientsPage />
                </RequireAgentPermission>
              }
            />
            <Route
              path="clients/:id"
              element={
                <RequireAgentPermission perm="clients">
                  <AgentClientDetailPage />
                </RequireAgentPermission>
              }
            />
            <Route
              path="referrals"
              element={
                <RequireAgentPermission perm="referrals">
                  <AgentReferralsPage />
                </RequireAgentPermission>
              }
            />
            <Route
              path="support"
              element={
                <RequireAgentPermission perm="support">
                  <AgentSupportPage />
                </RequireAgentPermission>
              }
            />
            <Route
              path="chat"
              element={
                <RequireAgentPermission perm="chat">
                  <AgentChatPage />
                </RequireAgentPermission>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<RedirectToMainSite />} />
      </Routes>
    </Suspense>
  )
}
