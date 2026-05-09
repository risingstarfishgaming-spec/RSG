import type { AuthUser } from '../types/auth'
import { apiUrl } from '../utils/api'

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body?.error) return body.error
  } catch {
    /* ignore */
  }
  return res.statusText || 'Something went wrong'
}

export async function registerAccount(payload: {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  referralCode?: string
}): Promise<{ message: string; user: AuthUser }> {
  const res = await fetch(apiUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json() as Promise<{ message: string; user: AuthUser }>
}

export class LoginError extends Error {
  readonly apiCode?: string

  constructor(message: string, apiCode?: string) {
    super(message)
    this.name = 'LoginError'
    this.apiCode = apiCode
  }
}

export async function loginAccount(payload: {
  email: string
  password: string
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(apiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let message = res.statusText || 'Something went wrong'
    let apiCode: string | undefined
    try {
      const body = (await res.json()) as { error?: string; code?: string }
      if (body.error) message = body.error
      if (typeof body.code === 'string') apiCode = body.code
    } catch {
      /* keep message from statusText */
    }
    throw new LoginError(message, apiCode)
  }
  return res.json() as Promise<{ token: string; user: AuthUser }>
}

export async function verifyEmailWithCode(payload: {
  email: string
  code: string
}): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/auth/verify-email'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json() as Promise<{ message: string }>
}

export async function resendVerificationCode(
  email: string,
): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/auth/resend-verification'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json() as Promise<{ message: string }>
}

export async function fetchMe(token: string): Promise<{ user: AuthUser }> {
  const res = await fetch(apiUrl('/auth/me'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json() as Promise<{ user: AuthUser }>
}

export async function requestPasswordReset(
  email: string,
): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/auth/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json() as Promise<{ message: string }>
}

export async function resetPasswordWithCode(payload: {
  email: string
  code: string
  password: string
}): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/auth/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json() as Promise<{ message: string }>
}
