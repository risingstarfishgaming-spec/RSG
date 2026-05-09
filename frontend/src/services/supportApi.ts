import { apiUrl } from '../utils/api'

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body?.error) return body.error
  } catch {
    /* ignore */
  }
  return res.statusText || 'Something went wrong'
}

export type SupportCategory =
  | 'general'
  | 'payment_related_queries'
  | 'game_issue'
  | 'complaint'
  | 'feedback'
  | 'business_queries'

export async function createSupportTicket(
  token: string,
  payload: {
    subject: string
    body: string
    category?: SupportCategory
    attachment?: File | null
  },
): Promise<{ id: string; ticketNumber?: string }> {
  if (payload.attachment) {
    const fd = new FormData()
    fd.append('subject', payload.subject)
    fd.append('body', payload.body)
    fd.append('category', payload.category ?? 'general')
    fd.append('attachment', payload.attachment)
    const res = await fetch(apiUrl('/support/tickets'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    if (!res.ok) throw new Error(await readError(res))
    const data = (await res.json()) as {
      ticket: { id: string; ticketNumber?: string }
    }
    return { id: data.ticket.id, ticketNumber: data.ticket.ticketNumber }
  }

  const res = await fetch(apiUrl('/support/tickets'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subject: payload.subject,
      body: payload.body,
      category: payload.category ?? 'general',
    }),
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as {
    ticket: { id: string; ticketNumber?: string }
  }
  return { id: data.ticket.id, ticketNumber: data.ticket.ticketNumber }
}

export type MyTicketSummary = {
  id: string
  ticketNumber?: string
  subject: string
  status: string
  category: string
  createdAt: string
  updatedAt?: string
  replyCount?: number
  attachmentUrl?: string
}

export async function listMySupportTickets(token: string): Promise<MyTicketSummary[]> {
  const res = await fetch(apiUrl('/support/tickets'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { tickets: MyTicketSummary[] }
  return data.tickets
}

export type TicketReply = {
  id?: string
  message: string
  fromStaff: boolean
  staffName?: string
  createdAt: string
}

export type MyTicketDetail = {
  id: string
  ticketNumber?: string
  subject: string
  body: string
  status: string
  category: string
  attachmentUrl?: string
  attachmentName?: string
  replies: TicketReply[]
  createdAt: string
  updatedAt?: string
}

export async function getMySupportTicket(
  token: string,
  id: string,
): Promise<MyTicketDetail> {
  const res = await fetch(apiUrl(`/support/tickets/${id}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { ticket: MyTicketDetail }
  return data.ticket
}
