import { Router } from 'express'
import { env } from '../config/env.js'
import { runIntegrationChecks } from '../services/integrationHealth.js'

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'new-site-api' })
})

/** Brevo + Cloudinary reachability (on in dev by default; see env.allowIntegrationHealth). */
healthRouter.get('/health/integrations', async (_req, res) => {
  if (!env.allowIntegrationHealth) {
    res.status(403).json({
      error: 'Integration health check is disabled',
      hint:
        'In production, set ALLOW_INTEGRATION_HEALTH=true in backend/.env, or run: npm run test:integrations',
      url: `http://localhost:${env.port}/api/health/integrations`,
    })
    return
  }
  try {
    const { mongo, brevo, cloudinary } = await runIntegrationChecks()
    const ok = mongo.ok && brevo.ok && cloudinary.ok
    res.json({
      ok,
      mongo: { ok: mongo.ok, message: mongo.message },
      brevo: { ok: brevo.ok, message: brevo.message },
      cloudinary: { ok: cloudinary.ok, message: cloudinary.message },
    })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'Integration check failed',
    })
  }
})
