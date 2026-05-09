/**
 * Home page “Platforms we provide” — replace with API response once admin CRUD + public endpoint exist.
 * Example: GET /api/platforms?active=true → map to HomePlatform[]
 */
export type HomePlatform = {
  id: string
  name: string
  description?: string
}

export const homePlatformsPlaceholder: HomePlatform[] = []
