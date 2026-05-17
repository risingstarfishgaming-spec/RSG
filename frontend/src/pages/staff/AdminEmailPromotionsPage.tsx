import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Loader2, Mail, Send, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { StaffCard } from '../../components/staff/ui/StaffCard'
import {
  staffInputClass,
  staffLabelClass,
} from '../../components/staff/ui/staffFormStyles'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffFetch, staffJson, StaffApiError } from '../../services/staffApi'

type Label = { id: string; name: string; color: string }

type UserRow = {
  id: string
  firstName: string
  lastName: string
  email: string
}

type RecipientOption = 'all' | 'selected' | 'byLabel'
type LabelMatch = 'any' | 'all'

type RecipientStats = {
  uniqueEmailCount: number
  usersMatched: number
  customEmailsAdded: number
  emailsNotFound: number
}

function splitList(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseEmails(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of splitList(raw)) {
    const email = part.toLowerCase()
    if (!email.includes('@')) continue
    if (seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out
}

export function AdminEmailPromotionsPage() {
  const token = useStaffAuthStore((s) => s.admin?.token ?? null)

  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [headerTitle, setHeaderTitle] = useState('')
  const [headerSubtitle, setHeaderSubtitle] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)

  const [labels, setLabels] = useState<Label[]>([])
  const [contacts, setContacts] = useState<UserRow[]>([])
  const [contactsTotal, setContactsTotal] = useState(0)
  const [contactsLoading, setContactsLoading] = useState(true)
  const [contactSearch, setContactSearch] = useState('')

  const [recipientOption, setRecipientOption] = useState<RecipientOption>('all')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [labelMatch, setLabelMatch] = useState<LabelMatch>('any')
  const [customEmails, setCustomEmails] = useState('')

  const [showPreview, setShowPreview] = useState(true)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const [recipientStats, setRecipientStats] = useState<RecipientStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const parsedCustomEmails = useMemo(() => parseEmails(customEmails), [customEmails])

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter((c) => {
      const hay = `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase()
      return hay.includes(q)
    })
  }, [contacts, contactSearch])

  function buildFormData(): FormData {
    const fd = new FormData()
    fd.append('subject', subject)
    fd.append('preheader', preheader)
    fd.append('headerTitle', headerTitle || 'A Message from RSFGaming')
    fd.append('headerSubtitle', headerSubtitle)
    fd.append('emailBody', emailBody)
    if (ctaLabel.trim()) fd.append('ctaLabel', ctaLabel.trim())
    if (ctaUrl.trim()) fd.append('ctaUrl', ctaUrl.trim())
    if (attachment) fd.append('attachment', attachment)

    if (recipientOption === 'all') {
      fd.append('sendToAll', 'true')
    } else if (recipientOption === 'selected' && selectedUserIds.length > 0) {
      fd.append('recipientIds', JSON.stringify(selectedUserIds))
    } else if (recipientOption === 'byLabel' && selectedLabelIds.length > 0) {
      fd.append('labelIds', JSON.stringify(selectedLabelIds))
      fd.append('labelMatch', labelMatch)
    }
    if (parsedCustomEmails.length > 0) {
      fd.append('recipientEmails', JSON.stringify(parsedCustomEmails))
    }
    return fd
  }

  useEffect(() => {
    if (!token) return
    void staffJson<{ success: boolean; data: Label[] }>('/admin/labels', token)
      .then((res) => setLabels(res.data))
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setContactsLoading(true)
    void staffJson<{ users: UserRow[]; total: number }>(
      '/admin/users?page=1&limit=500',
      token,
    )
      .then((res) => {
        if (!cancelled) {
          setContacts(res.users)
          setContactsTotal(res.total ?? res.users.length)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContacts([])
          setContactsTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const fetchPreview = useCallback(async () => {
    if (!token || !emailBody.trim()) {
      setPreviewHtml('')
      return
    }
    setPreviewLoading(true)
    try {
      const res = await staffFetch('/admin/email-promotions/preview', token, {
        method: 'POST',
        body: buildFormData(),
      })
      const data = (await res.json()) as { success?: boolean; html?: string; error?: string }
      if (!res.ok) {
        throw new StaffApiError(res.status, data.error ?? 'Preview failed')
      }
      setPreviewHtml(data.html ?? '')
    } catch (err) {
      setPreviewHtml('')
      if (err instanceof StaffApiError) toast.error(err.message)
    } finally {
      setPreviewLoading(false)
    }
  }, [
    token,
    subject,
    preheader,
    headerTitle,
    headerSubtitle,
    emailBody,
    ctaLabel,
    ctaUrl,
    attachment,
    recipientOption,
    selectedUserIds,
    selectedLabelIds,
    labelMatch,
    parsedCustomEmails,
  ])

  useEffect(() => {
    if (!showPreview || !emailBody.trim()) {
      setPreviewHtml('')
      return
    }
    const t = setTimeout(() => {
      void fetchPreview()
    }, 500)
    return () => clearTimeout(t)
  }, [showPreview, fetchPreview, emailBody])

  const fetchRecipientStats = useCallback(async () => {
    if (!token) return
    const body: Record<string, unknown> = {}
    if (recipientOption === 'all') body.sendToAll = true
    else if (recipientOption === 'selected') body.recipientIds = selectedUserIds
    else if (recipientOption === 'byLabel') {
      body.labelIds = selectedLabelIds
      body.labelMatch = labelMatch
    }
    if (parsedCustomEmails.length > 0) body.recipientEmails = parsedCustomEmails

    if (
      recipientOption !== 'all' &&
      selectedUserIds.length === 0 &&
      selectedLabelIds.length === 0 &&
      parsedCustomEmails.length === 0
    ) {
      setRecipientStats(null)
      return
    }

    setStatsLoading(true)
    try {
      const res = await staffJson<{ success: boolean; data: RecipientStats }>(
        '/admin/email-promotions/recipients/preview',
        token,
        { method: 'POST', body: JSON.stringify(body) },
      )
      setRecipientStats(res.data)
    } catch {
      setRecipientStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [token, recipientOption, selectedUserIds, selectedLabelIds, labelMatch, parsedCustomEmails])

  useEffect(() => {
    void fetchRecipientStats()
  }, [fetchRecipientStats])

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (!subject.trim()) {
      toast.error('Subject is required')
      return
    }
    if (!emailBody.trim()) {
      toast.error('Email body is required')
      return
    }
    if (
      recipientOption === 'selected' &&
      selectedUserIds.length === 0 &&
      parsedCustomEmails.length === 0
    ) {
      toast.error('Select members or add custom emails')
      return
    }
    if (
      recipientOption === 'byLabel' &&
      selectedLabelIds.length === 0 &&
      parsedCustomEmails.length === 0
    ) {
      toast.error('Select at least one label or add custom emails')
      return
    }

    setSending(true)
    setResult(null)
    try {
      const res = await staffFetch('/admin/email-promotions/send', token, {
        method: 'POST',
        body: buildFormData(),
      })
      const data = (await res.json()) as {
        message?: string
        error?: string
        sendResult?: { successful: number; total: number }
      }
      if (!res.ok) {
        throw new StaffApiError(res.status, data.error ?? 'Send failed')
      }
      setResult(data.message ?? 'Emails sent')
      toast.success(data.message ?? 'Emails sent')
    } catch (err) {
      const msg = err instanceof StaffApiError ? err.message : 'Send failed'
      setResult(msg)
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {showPreview ? 'Hide' : 'Show'} preview
        </button>
      </div>

      <form onSubmit={onSend}>
        <div className={`grid grid-cols-1 gap-6 ${showPreview ? 'lg:grid-cols-3' : ''}`}>
          <div className={showPreview ? 'space-y-6 lg:col-span-2' : 'space-y-6'}>
            <StaffCard className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email-subject" className="block text-sm font-semibold text-slate-900">
                    Email subject *
                  </label>
                  <input
                    id="email-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Appears in inbox (e.g. New bonuses just dropped)"
                    className={staffInputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email-preheader" className="block text-sm font-semibold text-slate-900">
                    Preheader
                  </label>
                  <input
                    id="email-preheader"
                    type="text"
                    value={preheader}
                    onChange={(e) => setPreheader(e.target.value)}
                    placeholder="Hidden inbox preview (1 line)"
                    className={staffInputClass}
                    maxLength={140}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Shown after the subject in most inboxes. Keep it short.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Header section</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="header-title" className={staffLabelClass}>
                      Header title
                    </label>
                    <input
                      id="header-title"
                      type="text"
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      placeholder="e.g. Important Announcement, Special Offer"
                      className={staffInputClass}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Large title at the top of the email. Default: Important Message
                    </p>
                  </div>
                  <div>
                    <label htmlFor="header-subtitle" className={staffLabelClass}>
                      Header subtitle (optional)
                    </label>
                    <input
                      id="header-subtitle"
                      type="text"
                      value={headerSubtitle}
                      onChange={(e) => setHeaderSubtitle(e.target.value)}
                      placeholder="e.g. Stay Updated With Us"
                      className={staffInputClass}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Shown below the title. Rising Star Fish Gaming tagline always appears above.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <label htmlFor="email-body" className="block text-sm font-semibold text-slate-900">
                  Email content / body *
                </label>
                <textarea
                  id="email-body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={10}
                  required
                  placeholder="Enter your email content here…"
                  className={`${staffInputClass} resize-none font-normal`}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Main content. Use line breaks to separate paragraphs.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="mb-1 text-lg font-semibold text-slate-900">Call to action (optional)</h3>
                <p className="mb-4 text-xs text-slate-500">
                  Adds a gold button below the body. Use https:// URLs only.
                </p>
                <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                  <div>
                    <label htmlFor="cta-label" className={staffLabelClass}>
                      Button label
                    </label>
                    <input
                      id="cta-label"
                      type="text"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder="e.g. Claim bonus"
                      maxLength={32}
                      className={staffInputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="cta-url" className={staffLabelClass}>
                      Button URL
                    </label>
                    <input
                      id="cta-url"
                      type="url"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://rsfgaming.com/bonuses"
                      className={staffInputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 block text-sm font-semibold text-slate-900">
                  Attachment (optional)
                </p>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-50/30">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="h-5 w-5 text-slate-400" aria-hidden />
                  <span className="text-sm text-slate-600">
                    {attachment ? attachment.name : 'Click to upload attachment'}
                  </span>
                </label>
                {attachment ? (
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    Remove attachment
                  </button>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">
                  Images, PDF, Word, Excel (max 10MB). Embedded in the email body.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <p className="mb-3 block text-sm font-semibold text-slate-900">Recipients</p>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="email-recipient"
                      checked={recipientOption === 'all'}
                      onChange={() => setRecipientOption('all')}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700">
                      All members ({contactsLoading ? '…' : contactsTotal})
                    </span>
                  </label>
                  {recipientOption === 'all' && (
                    <div className="ml-7 mt-2 space-y-2">
                      <input
                        type="search"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Filter list to verify recipients…"
                        className={staffInputClass.replace('mt-1', 'mt-0')}
                      />
                      <div className="max-h-64 overflow-y-auto rounded-lg border-2 border-slate-200 bg-slate-50 p-2">
                        {contactsLoading ? (
                          <p className="px-2 py-3 text-center text-xs text-slate-500">
                            Loading members…
                          </p>
                        ) : filteredContacts.length === 0 ? (
                          <p className="px-2 py-3 text-center text-xs text-slate-500">
                            No matching members.
                          </p>
                        ) : (
                          filteredContacts.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-2 truncate rounded px-2 py-1 text-xs text-slate-700"
                            >
                              <span className="truncate font-mono">{c.email}</span>
                              <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                                {c.firstName} {c.lastName}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {contactsTotal > contacts.length
                          ? `Preview shows first ${contacts.length} of ${contactsTotal}. All ${contactsTotal} members will receive the email.`
                          : `${contactsTotal} member${contactsTotal === 1 ? '' : 's'} will receive the email.`}
                      </p>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="email-recipient"
                      checked={recipientOption === 'selected'}
                      onChange={() => setRecipientOption('selected')}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700">Selected members</span>
                  </label>
                  {recipientOption === 'selected' && (
                    <div className="ml-7 mt-2 space-y-2">
                      <input
                        type="search"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Search name or email…"
                        className={staffInputClass.replace('mt-1', 'mt-0')}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500">
                          {selectedUserIds.length} of {contacts.length} selected
                          {contactSearch.trim()
                            ? ` · ${filteredContacts.length} match filter`
                            : ''}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const ids = filteredContacts.map((c) => c.id)
                              setSelectedUserIds((prev) =>
                                Array.from(new Set([...prev, ...ids])),
                              )
                            }}
                            disabled={contactsLoading || filteredContacts.length === 0}
                            className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                          >
                            {contactSearch.trim()
                              ? `Select ${filteredContacts.length} visible`
                              : 'Select all'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUserIds([])}
                            disabled={selectedUserIds.length === 0}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto rounded-lg border-2 border-slate-200 p-2">
                        {contactsLoading ? (
                          <p className="px-2 py-3 text-center text-xs text-slate-500">
                            Loading members…
                          </p>
                        ) : filteredContacts.length === 0 ? (
                          <p className="px-2 py-3 text-center text-xs text-slate-500">
                            No matching members.
                          </p>
                        ) : (
                          filteredContacts.map((c) => (
                            <label
                              key={c.id}
                              className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(c.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds((prev) => [...prev, c.id])
                                  } else {
                                    setSelectedUserIds((prev) =>
                                      prev.filter((id) => id !== c.id),
                                    )
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                              />
                              <span className="truncate text-sm text-slate-700">{c.email}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="email-recipient"
                      checked={recipientOption === 'byLabel'}
                      onChange={() => setRecipientOption('byLabel')}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700">By label</span>
                  </label>
                  {recipientOption === 'byLabel' && (
                    <div className="ml-7 mt-2 space-y-3 rounded-lg border-2 border-slate-200 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Match:</span>
                        <button
                          type="button"
                          onClick={() => setLabelMatch('any')}
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            labelMatch === 'any'
                              ? 'bg-indigo-100 font-medium text-indigo-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          Any label
                        </button>
                        <button
                          type="button"
                          onClick={() => setLabelMatch('all')}
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            labelMatch === 'all'
                              ? 'bg-indigo-100 font-medium text-indigo-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          All labels
                        </button>
                      </div>
                      {labels.length === 0 ? (
                        <p className="text-center text-sm text-slate-500">
                          No labels yet.{' '}
                          <Link to="/admin/labels" className="font-semibold text-indigo-600">
                            Create labels
                          </Link>
                        </p>
                      ) : (
                        labels.map((label) => (
                          <label
                            key={label.id}
                            className="flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLabelIds.includes(label.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLabelIds((prev) => [...prev, label.id])
                                } else {
                                  setSelectedLabelIds((prev) =>
                                    prev.filter((id) => id !== label.id),
                                  )
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                            />
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: label.color }}
                              aria-hidden
                            />
                            <span className="text-sm text-slate-700">{label.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label htmlFor="extra-emails" className={staffLabelClass}>
                    Additional emails (optional)
                  </label>
                  <textarea
                    id="extra-emails"
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    rows={3}
                    placeholder={'member@example.com\nfriend@example.com'}
                    className={`${staffInputClass} font-mono text-xs`}
                  />
                </div>
              </div>

              {statsLoading ? (
                <p className="text-sm text-slate-500">Calculating recipients…</p>
              ) : recipientStats ? (
                <p className="text-sm text-slate-600">
                  <strong>{recipientStats.uniqueEmailCount}</strong> email address(es) will receive
                  this message
                  {recipientStats.emailsNotFound > 0
                    ? ` · ${recipientStats.emailsNotFound} custom email(s) not in member database`
                    : ''}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={sending || !subject.trim() || !emailBody.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-3 px-4 text-sm font-semibold text-white hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" aria-hidden />
                    Send promotional email
                  </>
                )}
              </button>
            </StaffCard>
          </div>

          {showPreview ? (
            <div className="lg:col-span-1">
              <StaffCard className="sticky top-6 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Email preview</h3>
                  {previewLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden />
                  ) : null}
                </div>
                {previewHtml ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                    <iframe
                      title="Email preview"
                      srcDoc={previewHtml}
                      className="w-full border-0"
                      style={{ minHeight: '720px', background: '#0B1020' }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Mail className="mb-3 h-12 w-12 text-slate-300" aria-hidden />
                    <p className="text-sm text-slate-500">Enter email content to see preview</p>
                  </div>
                )}
              </StaffCard>
            </div>
          ) : null}
        </div>
      </form>

      {result ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          {result}
        </p>
      ) : null}
    </div>
  )
}
