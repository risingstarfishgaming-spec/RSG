import axios from 'axios'
import mongoose from 'mongoose'
import {
  cloudinary,
  configureCloudinary,
  isCloudinaryConfigured,
} from '../config/cloudinaryClient.js'
import { env } from '../config/env.js'

export type IntegrationCheck = {
  ok: boolean
  message: string
}

const BREVO_ACCOUNT_URL = 'https://api.brevo.com/v3/account'

/** Validates Brevo API key via account endpoint (no email sent). */
export async function checkBrevo(): Promise<IntegrationCheck> {
  if (!env.brevoApiKey?.trim()) {
    return { ok: false, message: 'BREVO_API_KEY is not set' }
  }

  try {
    const { data } = await axios.get<{
      email?: string
      firstName?: string
      companyName?: string
    }>(BREVO_ACCOUNT_URL, {
      headers: {
        accept: 'application/json',
        'api-key': env.brevoApiKey,
      },
      timeout: 15_000,
    })
    const label = data.companyName || data.firstName || data.email || 'account'
    return {
      ok: true,
      message: `Brevo API OK (${label})`,
    }
  } catch (e: unknown) {
    const msg = axios.isAxiosError(e)
      ? e.response?.data &&
          typeof e.response.data === 'object' &&
          'message' in e.response.data
        ? String((e.response.data as { message: unknown }).message)
        : e.message
      : e instanceof Error
        ? e.message
        : 'Unknown error'
    return { ok: false, message: `Brevo failed: ${msg}` }
  }
}

/** Validates Cloudinary credentials via Admin API ping. */
export async function checkCloudinary(): Promise<IntegrationCheck> {
  if (!isCloudinaryConfigured()) {
    return {
      ok: false,
      message:
        'Cloudinary not configured (set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET)',
    }
  }

  configureCloudinary()

  try {
    const result = (await cloudinary.api.ping()) as Record<string, unknown>
    const status =
      result?.status === 'ok' ? 'ok' : JSON.stringify(result ?? {})
    return {
      ok: true,
      message: `Cloudinary API OK (ping status: ${status})`,
    }
  } catch (e: unknown) {
    const msg =
      e instanceof Error
        ? e.message
        : typeof e === 'object' && e !== null && 'error' in e
          ? JSON.stringify((e as { error: unknown }).error)
          : String(e)
    return { ok: false, message: `Cloudinary failed: ${msg}` }
  }
}

/** Validates MongoDB connection state used by the API process. */
export async function checkMongo(): Promise<IntegrationCheck> {
  if (!env.mongodbUri?.trim()) {
    return { ok: false, message: 'MONGODB_URI is not set' }
  }

  if (mongoose.connection.readyState !== 1) {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }
    const state = states[mongoose.connection.readyState] ?? 'unknown'
    return {
      ok: false,
      message: `MongoDB not connected (state: ${state})`,
    }
  }

  try {
    const db = mongoose.connection.db
    if (!db) {
      return { ok: false, message: 'MongoDB db handle not available' }
    }
    await db.admin().ping()
    return { ok: true, message: 'MongoDB API OK (ping successful)' }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, message: `MongoDB failed: ${msg}` }
  }
}

export async function runIntegrationChecks(): Promise<{
  mongo: IntegrationCheck
  brevo: IntegrationCheck
  cloudinary: IntegrationCheck
}> {
  const [mongo, brevo, cloudinaryResult] = await Promise.all([
    checkMongo(),
    checkBrevo(),
    checkCloudinary(),
  ])
  return { mongo, brevo, cloudinary: cloudinaryResult }
}
