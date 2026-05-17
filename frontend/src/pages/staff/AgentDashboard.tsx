import { Link } from 'react-router'
import { StaffOverviewMetrics } from '../../components/staff/StaffOverviewMetrics'
import { useStaffSession } from '../../stores/staffAuthStore'
import { agentCan } from '../../utils/agentPermissions'

export function AgentDashboard() {
  const { token, staff } = useStaffSession('agent')
  const canClients = agentCan(staff, 'clients')
  const canReferrals = agentCan(staff, 'referrals')
  const canSupport = agentCan(staff, 'support')
  const canChat = agentCan(staff, 'chat')

  return (
    <div className="space-y-10">
      <StaffOverviewMetrics
        token={token}
        apiBase="/agent"
      />

      <div>
        <p className="max-w-xl text-sm text-slate-600">
          Manage client labels and notes, referrals, support, and chat. Your
          admin controls which areas you can open.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {canClients ? (
            <Link
              to="/agent/clients"
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800 shadow-sm hover:bg-indigo-100"
            >
              Browse clients
            </Link>
          ) : null}
          {canReferrals ? (
            <Link
              to="/agent/referrals"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm hover:border-indigo-200"
            >
              Referrals
            </Link>
          ) : null}
          {canSupport ? (
            <Link
              to="/agent/support"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm hover:border-indigo-200"
            >
              Support tickets
            </Link>
          ) : null}
          {canChat ? (
            <Link
              to="/agent/chat"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm hover:border-indigo-200"
            >
              Live chat
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
