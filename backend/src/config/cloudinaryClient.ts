import { v2 as cloudinary } from 'cloudinary'
import { env } from './env.js'

/**
 * Prefer CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME) — same as Cloudinary dashboard.
 * Otherwise uses CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.cloudinaryUrl?.trim() ||
      (env.cloudinaryCloudName?.trim() &&
        env.cloudinaryApiKey?.trim() &&
        env.cloudinaryApiSecret?.trim()),
  )
}

export function configureCloudinary(): void {
  if (env.cloudinaryUrl?.trim()) {
    cloudinary.config(true)
    cloudinary.config({ secure: true })
    return
  }
  if (
    env.cloudinaryCloudName?.trim() &&
    env.cloudinaryApiKey?.trim() &&
    env.cloudinaryApiSecret?.trim()
  ) {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    })
  }
}

export { cloudinary }
