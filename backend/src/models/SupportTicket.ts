import mongoose from 'mongoose'

export type TicketStatus =
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'removed'

export type TicketCategory =
  | 'general'
  | 'payment_related_queries'
  | 'game_issue'
  | 'complaint'
  | 'feedback'
  | 'business_queries'

const replySchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 8000 },
    fromStaff: { type: Boolean, default: true },
    staffName: { type: String, trim: true, maxlength: 120 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 16_000 },
    status: {
      type: String,
      enum: ['open', 'pending', 'in_progress', 'resolved', 'closed', 'removed'] satisfies TicketStatus[],
      default: 'open',
      index: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 64,
      default: 'general',
      index: true,
    },
    attachmentUrl: { type: String, trim: true },
    attachmentName: { type: String, trim: true },
    attachmentType: { type: String, trim: true },
    attachmentSize: { type: Number },
    notes: { type: String, trim: true, maxlength: 4000 },
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: true },
)

supportTicketSchema.index({ status: 1, createdAt: -1 })
supportTicketSchema.index({ category: 1, status: 1 })

function generateTicketNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const r = Math.floor(Math.random() * 1e6)
    .toString()
    .padStart(6, '0')
  return `TKT-${ts}-${r}`
}

supportTicketSchema.pre('save', async function () {
  if (this.ticketNumber && String(this.ticketNumber).trim()) return
  const Model = this.constructor as mongoose.Model<{ ticketNumber?: string }>
  for (let i = 0; i < 8; i++) {
    const candidate = generateTicketNumber()
    const exists = await Model.exists({ ticketNumber: candidate })
    if (!exists) {
      this.ticketNumber = candidate
      return
    }
  }
  this.ticketNumber = generateTicketNumber()
})

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema)
