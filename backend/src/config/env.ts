import 'dotenv/config'

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback
  if (v === undefined || v === '') {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return v
}

const nodeEnv = process.env.NODE_ENV ?? 'development'

/**
 * Origins from FRONTEND_URL (comma-separated). In development, any
 * `http://localhost:PORT` / `127.0.0.1` entry also allows
 * `http://super.localhost:PORT` so the staff subdomain dev host can call the API
 * without editing .env.
 */
function resolveFrontendOrigins(): string[] {
  const raw = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const set = new Set<string>(raw)
  if (nodeEnv !== 'production') {
    for (const o of raw) {
      try {
        const u = new URL(o)
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          const sup = u.port
            ? `${u.protocol}//super.localhost:${u.port}`
            : `${u.protocol}//super.localhost`
          set.add(sup)
        }
      } catch {
        /* ignore invalid URL */
      }
    }
  }
  return [...set]
}

/** Brevo + Cloudinary ping at GET /api/health/integrations */
function resolveAllowIntegrationHealth(): boolean {
  if (process.env.ALLOW_INTEGRATION_HEALTH === 'true') return true
  if (process.env.ALLOW_INTEGRATION_HEALTH === 'false') return false
  return nodeEnv !== 'production'
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 5000),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT ?? 30_000),
  mongodbUri: process.env.MONGODB_URI ?? '',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  /** Browser origins allowed for CORS (see resolveFrontendOrigins). */
  frontendOrigins: resolveFrontendOrigins(),
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:5000',
  jwtSecret: required('JWT_SECRET', process.env.NODE_ENV === 'development' ? 'dev' : undefined),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  agentJwtSecret: required(
    'AGENT_JWT_SECRET',
    process.env.NODE_ENV === 'development' ? 'dev' : undefined,
  ),
  /** If true, verification emails are skipped and the link is logged (local dev). */
  skipEmail: process.env.SKIP_EMAIL === 'true',
  /** Trimmed — leading/trailing spaces in .env break Brevo auth */
  brevoApiKey: (process.env.BREVO_API_KEY ?? '').trim(),
  brevoFromEmail: (process.env.BREVO_FROM_EMAIL ?? 'noreply@localhost').trim(),
  brevoFromName: (process.env.BREVO_FROM_NAME ?? 'RSFGaming').trim(),
  brevoReplyTo: (process.env.BREVO_REPLY_TO ?? '').trim(),

  /** cloudinary://API_KEY:API_SECRET@CLOUD_NAME — if set, overrides separate Cloudinary vars for the SDK */
  cloudinaryUrl: process.env.CLOUDINARY_URL ?? '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',

  /**
   * GET /api/health/integrations — off in production unless ALLOW_INTEGRATION_HEALTH=true;
   * on in development/test by default (opt out with ALLOW_INTEGRATION_HEALTH=false).
   */
  allowIntegrationHealth: resolveAllowIntegrationHealth(),
}
