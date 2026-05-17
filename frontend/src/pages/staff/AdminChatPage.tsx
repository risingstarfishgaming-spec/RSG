import { AdminChatPanel } from '../../components/staff/chat/AdminChatPanel'
import { useStaffAuthStore } from '../../stores/staffAuthStore'

export function AdminChatPage() {
  const token = useStaffAuthStore((s) => s.admin?.token ?? null)
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:-mx-2">
      {/*
      <p className="mb-3 max-w-xl shrink-0 text-sm text-slate-600">
        Member conversations (Socket.io + live updates). Pick a thread on the
        left, reply on the right.
      </p>
      */}
      <div className="min-h-0 flex-1">
        <AdminChatPanel
          token={token}
          apiRole="admin"
        />
      </div>
    </div>
  )
}
