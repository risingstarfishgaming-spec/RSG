import mongoose from 'mongoose'

function normalizeReplyTo(
  replyTo: unknown,
):
  | {
      messageId: string
      message?: string
      senderName?: string
      senderType?: string
    }
  | undefined {
  if (!replyTo || typeof replyTo !== 'object') return undefined
  const r = replyTo as Record<string, unknown>
  if (r.messageId == null) return undefined
  return {
    messageId: String(r.messageId),
    message: r.message as string | undefined,
    senderName: r.senderName as string | undefined,
    senderType: r.senderType as string | undefined,
  }
}

export function serializeChatMessageDoc(doc: {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  staffId?: mongoose.Types.ObjectId
  senderType: string
  message?: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentType?: string
  attachmentSize?: number
  status: string
  name?: string
  email?: string
  readAt?: Date
  resolvedAt?: Date
  replyTo?: unknown
  reactions?: unknown[]
  metadata?: unknown
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    staffId: doc.staffId?.toString(),
    senderType: doc.senderType,
    message: doc.message,
    attachmentUrl: doc.attachmentUrl,
    attachmentName: doc.attachmentName,
    attachmentType: doc.attachmentType,
    attachmentSize: doc.attachmentSize,
    status: doc.status,
    name: doc.name,
    email: doc.email,
    readAt: doc.readAt,
    resolvedAt: doc.resolvedAt,
    replyTo: normalizeReplyTo(doc.replyTo),
    reactions: doc.reactions ?? [],
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}
