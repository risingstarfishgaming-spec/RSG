/** Format CMS enum-style strings: `free_spins` → `Free spins` */
export function formatEnumLabel(value: string): string {
  if (!value.trim()) return value
  return value
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
