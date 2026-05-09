export function agentSectionTitle(pathname: string): string {
  const path = pathname.replace(/\/$/, '') || '/agent'
  if (path === '/agent') return 'Overview'
  if (path.startsWith('/agent/clients/') && path !== '/agent/clients') {
    return 'Client detail'
  }
  const seg = path.replace(/^\/agent\/?/, '').split('/')[0]
  const map: Record<string, string> = {
    clients: 'Clients',
    referrals: 'Referrals',
    support: 'Support',
    chat: 'Live chat',
  }
  return map[seg] ?? 'Agent'
}
