import { AdminChatPanel } from '../../components/staff/chat/AdminChatPanel'
import { useStaffAuthStore } from '../../stores/staffAuthStore'

export function AgentChatPage() {
  const token = useStaffAuthStore((s) => s.agent?.token ?? null)
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:-mx-2">
      {/*
      <p className="mb-3 max-w-xl shrink-0 text-sm text-slate-600">
        Same inbox as admin, scoped to your agent session (/api/agent/chat).
        The thread list and messages scroll inside this panel.
      </p>
      */}
      <div className="min-h-0 flex-1">
        <AdminChatPanel
          token={token}
          apiRole="agent"
        />
      </div>
    </div>
  )
}
