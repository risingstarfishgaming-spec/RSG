import { randomInt } from 'node:crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function randomReferralSegment(length: number): string {
  let s = ''
  for (let i = 0; i < length; i++) {
    s += ALPHABET[randomInt(ALPHABET.length)]
  }
  return s
}

/** Generate a unique referral code using a DB existence check. */
export async function generateUniqueReferralCode(
  codeExists: (code: string) => Promise<boolean>,
  length = 8,
  maxAttempts = 15,
): Promise<string> {
  for (let a = 0; a < maxAttempts; a++) {
    const code = randomReferralSegment(length)
    if (!(await codeExists(code))) return code
  }
  throw new Error('Could not allocate unique referral code')
}
