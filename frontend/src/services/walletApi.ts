import { apiUrl } from '../utils/api'

export async function getWalletHealth(): Promise<Response> {
  return fetch(apiUrl('/wallet'), { credentials: 'include' })
}
