import mongoose from 'mongoose'
import { Label } from '../models/Label.js'
import { User } from '../models/User.js'
import { HttpError } from './HttpError.js'

export type BulkEmailRecipientInput = {
  sendToAll?: boolean
  userIds?: string[]
  labelIds?: string[]
  labelMatch?: 'any' | 'all'
  emails?: string[]
}

export type BulkEmailRecipientStats = {
  uniqueEmailCount: number
  usersMatched: number
  customEmailsAdded: number
  emailsNotFound: number
  invalidUserIds: number
  invalidLabelIds: number
}

export type ResolvedBulkEmailRecipients = {
  recipientEmails: string[]
  stats: BulkEmailRecipientStats
}

function parseObjectIds(ids: string[] | undefined): {
  valid: mongoose.Types.ObjectId[]
  invalidCount: number
} {
  const raw = ids ?? []
  const valid: mongoose.Types.ObjectId[] = []
  let invalidCount = 0
  for (const id of raw) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      valid.push(new mongoose.Types.ObjectId(id))
    } else {
      invalidCount += 1
    }
  }
  return { valid, invalidCount }
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export async function resolveBulkEmailRecipients(
  input: BulkEmailRecipientInput,
): Promise<ResolvedBulkEmailRecipients> {
  const sendToAll = input.sendToAll === true
  const userIds = input.userIds ?? []
  const labelIds = input.labelIds ?? []
  const labelMatch = input.labelMatch === 'all' ? 'all' : 'any'
  const customEmails = (input.emails ?? []).map(normalizeEmail).filter(Boolean)

  if (!sendToAll && userIds.length === 0 && labelIds.length === 0 && customEmails.length === 0) {
    throw new HttpError(400, 'Choose recipients (all members, selected, by label, or custom emails)')
  }

  const { valid: userOids, invalidCount: invalidUserIds } = parseObjectIds(userIds)
  const { valid: labelOids, invalidCount: invalidLabelIds } = parseObjectIds(labelIds)

  if (labelOids.length > 0) {
    const labelCount = await Label.countDocuments({ _id: { $in: labelOids } })
    if (labelCount !== labelOids.length) {
      throw new HttpError(400, 'One or more label ids are invalid')
    }
  }

  const userIdSet = new Set<string>()

  if (sendToAll) {
    const all = await User.find({}).select('_id').lean()
    for (const u of all) userIdSet.add(u._id.toString())
  }

  for (const oid of userOids) {
    userIdSet.add(oid.toString())
  }

  if (labelOids.length > 0) {
    const labelFilter =
      labelMatch === 'all'
        ? { crmLabelIds: { $all: labelOids } }
        : { crmLabelIds: { $in: labelOids } }
    const labeled = await User.find(labelFilter).select('_id').lean()
    for (const u of labeled) {
      userIdSet.add(u._id.toString())
    }
  }

  const emailSet = new Set<string>()
  let emailsNotFound = 0

  const allUserOids = [...userIdSet].map((id) => new mongoose.Types.ObjectId(id))
  const users =
    allUserOids.length > 0
      ? await User.find({ _id: { $in: allUserOids } }).select('email').lean()
      : []

  for (const u of users) {
    const email = typeof u.email === 'string' ? normalizeEmail(u.email) : ''
    if (email) emailSet.add(email)
  }

  if (customEmails.length > 0) {
    const found = await User.find({ email: { $in: customEmails } }).select('email').lean()
    const foundEmails = new Set(found.map((u) => normalizeEmail(u.email as string)))
    for (const e of customEmails) {
      if (!foundEmails.has(e)) emailsNotFound += 1
      emailSet.add(e)
    }
  }

  const recipientEmails = [...emailSet]

  if (recipientEmails.length === 0) {
    throw new HttpError(400, 'No valid recipient emails found')
  }

  return {
    recipientEmails,
    stats: {
      uniqueEmailCount: recipientEmails.length,
      usersMatched: users.length,
      customEmailsAdded: customEmails.length,
      emailsNotFound,
      invalidUserIds,
      invalidLabelIds,
    },
  }
}
