import type { AgentPermission, StaffUser } from '../types/staff'

export function agentCan(
  staff: StaffUser | null,
  perm: AgentPermission,
): boolean {
  if (!staff || staff.role !== 'agent') return true
  const p = staff.permissions
  if (!p || p.length === 0) return true
  return p.includes(perm)
}
