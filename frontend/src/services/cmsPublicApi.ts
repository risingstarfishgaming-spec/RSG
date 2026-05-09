import { apiUrl } from '../utils/api'

export type PublicPlatform = {
  _id: string
  name: string
  description: string
  image: string
  gameLink: string
  isActive: boolean
  order: number
}

export type PublicBonus = {
  _id: string
  title: string
  description: string
  image: string
  bonusType: string
  bonusValue?: string
  termsAndConditions?: string
  isActive: boolean
  order: number
  validFrom?: string
  validUntil?: string
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

export async function fetchPublicPlatforms(): Promise<PublicPlatform[]> {
  const res = await fetch(apiUrl('/platforms'))
  const body = await readJson<{ success?: boolean; data?: PublicPlatform[] }>(res)
  if (!res.ok) throw new Error('Could not load platforms')
  return body.data ?? []
}

export async function fetchPublicBonuses(): Promise<PublicBonus[]> {
  const res = await fetch(apiUrl('/bonuses'))
  const body = await readJson<{ success?: boolean; data?: PublicBonus[] }>(res)
  if (!res.ok) throw new Error('Could not load bonuses')
  return body.data ?? []
}

export async function claimBonus(bonusId: string, token: string): Promise<void> {
  const res = await fetch(apiUrl(`/bonuses/${bonusId}/claim`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const text = await res.text()
    let msg = `Claim failed (${res.status})`
    if (text) {
      try {
        const body = JSON.parse(text) as { error?: string; message?: string }
        msg = body.error ?? body.message ?? msg
      } catch {
        /* non-JSON error body */
      }
    }
    throw new Error(msg)
  }
}
