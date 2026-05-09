import { apiUrl } from '../utils/api'

export async function getLoanHealth(): Promise<Response> {
  return fetch(apiUrl('/loan'), { credentials: 'include' })
}
