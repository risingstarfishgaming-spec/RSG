/**
 * Create the first admin when none exists.
 * Usage: INITIAL_ADMIN_EMAIL=... INITIAL_ADMIN_PASSWORD=... npx tsx scripts/seed-staff.ts
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { Staff } from '../src/models/Staff.js'
import { logger } from '../src/utils/logger.js'

async function main() {
  const email = (process.env.INITIAL_ADMIN_EMAIL ?? '').trim().toLowerCase()
  const password = process.env.INITIAL_ADMIN_PASSWORD ?? ''
  if (!email || !password || password.length < 8) {
    console.error(
      'Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD (min 8 chars) in the environment.',
    )
    process.exit(1)
  }
  if (!env.mongodbUri) {
    console.error('MONGODB_URI is required.')
    process.exit(1)
  }
  await mongoose.connect(env.mongodbUri)
  const exists = await Staff.exists({ role: 'admin' })
  if (exists) {
    logger.info('An admin already exists — skipping seed.')
    await mongoose.disconnect()
    return
  }
  const hash = await bcrypt.hash(password, 12)
  await Staff.create({
    email,
    password: hash,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'admin',
    isActive: true,
    createdBy: null,
  })
  logger.info(`Bootstrap admin created: ${email}`)
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
