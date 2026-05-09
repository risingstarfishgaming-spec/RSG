export type StaffRole = 'admin' | 'agent'

export type AgentPermission = 'chat' | 'clients' | 'support' | 'referrals'

export type StaffUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: StaffRole
  /** Present for agents — tab access. */
  permissions?: AgentPermission[]
}
