/** Decode HTML entities from backend-sanitized text for safe display. */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  const decoded = textarea.value
  textarea.remove()
  return decoded
}

export function formatDateDivider(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const CHAT_QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😢'] as const
export const CHAT_MORE_EMOJIS = [
  '😮',
  '🎉',
  '👏',
  '🙏',
  '😍',
  '💯',
  '👎',
  '😡',
  '🤔',
  '✅',
] as const

export const CHAT_MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
