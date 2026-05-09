/** Strip control chars; escape HTML entities (Ace-compatible subset, no validator dep). */
export function sanitizeString(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return ''
  const t = input.trim().replace(/[\u0000-\u001F\u007F]/g, '')
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function sanitizeText(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return ''
  const t = input.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
