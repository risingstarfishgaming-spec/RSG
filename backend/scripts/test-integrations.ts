/**
 * Test Brevo (API key) and Cloudinary (admin ping) using backend/.env
 *
 * Usage: npm run test:integrations
 */
import 'dotenv/config'
import { runIntegrationChecks } from '../src/services/integrationHealth.js'

async function main() {
  console.log('RSFGaming — integration checks\n')
  const { mongo, brevo, cloudinary } = await runIntegrationChecks()

  const line = (name: string, r: { ok: boolean; message: string }) => {
    const icon = r.ok ? '✓' : '✗'
    console.log(`${icon} ${name}: ${r.message}`)
  }

  line('MongoDB', mongo)
  line('Brevo', brevo)
  line('Cloudinary', cloudinary)

  const allOk = mongo.ok && brevo.ok && cloudinary.ok
  if (!allOk) {
    console.log(
      '\nTip: ensure backend/.env has BREVO_* and CLOUDINARY_* set. SKIP_EMAIL does not affect this test.',
    )
    process.exitCode = 1
  } else {
    console.log('\nAll configured integrations responded OK.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
