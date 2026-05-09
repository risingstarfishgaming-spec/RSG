/** Base URL for REST API (see frontend/env.example). */
export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '/api'

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}${p}`
}

/** Socket.io HTTP origin (no path). See `VITE_WS_URL` in env.example. */
export function getWsBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WS_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (apiBaseUrl.startsWith('http')) {
    return apiBaseUrl.replace(/\/api$/, '')
  }
  return 'http://localhost:5000'
}

export function getAttachmentUrl(attachmentUrl: string): string {
  if (attachmentUrl.startsWith('http://') || attachmentUrl.startsWith('https://')) {
    return attachmentUrl
  }
  const origin = apiBaseUrl.startsWith('http')
    ? apiBaseUrl.replace(/\/api$/, '')
    : ''
  return `${origin}${attachmentUrl}`
}

export function isImageAttachment(
  attachmentType?: string,
  attachmentName?: string,
): boolean {
  if (attachmentType?.startsWith('image/')) return true
  const ext = attachmentName?.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext ?? '')
}
