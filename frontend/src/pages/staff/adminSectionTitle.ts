/** Section title for admin sticky header from current path. */
export function adminSectionTitle(pathname: string): string {
  const path = pathname.replace(/\/$/, '') || '/admin'
  if (path === '/admin') return 'Overview'
  const seg = path.replace(/^\/admin\/?/, '').split('/')[0]
  const map: Record<string, string> = {
    users: 'Users',
    labels: 'Label management',
    email: 'Email promotions',
    agents: 'Agents',
    platforms: 'Platforms',
    bonuses: 'Bonuses',
    support: 'Support tickets',
    chat: 'Live chat',
    analytics: 'Analytics',
  }
  return map[seg] ?? 'Admin'
}
