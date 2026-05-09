import mongoose from 'mongoose'

export type ChatMessageStatus = 'unread' | 'read' | 'resolved' | 'sent'
export type ChatMessageSender = 'user' | 'admin' | 'system'

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    reactorId: { type: String, required: true },
    reactorType: { type: String, enum: ['user', 'admin'], required: true },
    reactorName: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const replyToSchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
    message: { type: String, trim: true, maxlength: 500 },
    senderName: { type: String, trim: true },
    senderType: { type: String, enum: ['user', 'admin', 'system'] },
  },
  { _id: false },
)

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    senderType: {
      type: String,
      enum: ['user', 'admin', 'system'] satisfies ChatMessageSender[],
      required: true,
    },
    message: { type: String, trim: true, maxlength: 2000 },
    attachmentUrl: { type: String, trim: true },
    attachmentName: { type: String, trim: true },
    attachmentType: { type: String, trim: true },
    attachmentSize: { type: Number },
    status: {
      type: String,
      enum: ['unread', 'read', 'resolved', 'sent'] satisfies ChatMessageStatus[],
      default: 'unread',
      index: true,
    },
    name: { type: String, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true },
    readAt: { type: Date },
    resolvedAt: { type: Date },
    replyTo: replyToSchema,
    reactions: { type: [reactionSchema], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
)

chatMessageSchema.index({ userId: 1, createdAt: -1 })

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema)
