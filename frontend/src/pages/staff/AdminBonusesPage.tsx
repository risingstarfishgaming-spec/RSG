import { useCallback, useEffect, useState } from 'react'
import { StaffCard } from '../../components/staff/ui/StaffCard'
import { StaffModal } from '../../components/staff/ui/StaffModal'
import { StaffPageHeader } from '../../components/staff/ui/StaffPageHeader'
import {
  staffInputClass,
  staffLabelClass,
} from '../../components/staff/ui/staffFormStyles'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffFetch, staffJson, StaffApiError } from '../../services/staffApi'

type BonusType = 'welcome' | 'deposit' | 'free_spins' | 'cashback' | 'other'

type Bonus = {
  _id: string
  title: string
  description: string
  image: string
  bonusType: BonusType
  bonusValue?: string
  termsAndConditions?: string
  isActive: boolean
  order: number
  validFrom?: string
  validUntil?: string
  maxClaims?: number
  cooldownHours?: number
}

const emptyForm = {
  title: '',
  description: '',
  image: '',
  bonusType: 'other' as BonusType,
  bonusValue: '',
  termsAndConditions: '',
  order: 0,
  isActive: true,
  validFrom: '',
  validUntil: '',
  maxClaims: 1,
  cooldownHours: 0,
}

function isoInput(d?: string) {
  if (!d) return ''
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return ''
  return x.toISOString().slice(0, 16)
}

export function AdminBonusesPage() {
  const token = useStaffAuthStore((s) => s.admin?.token ?? null)
  const [rows, setRows] = useState<Bonus[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Bonus | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await staffJson<{ success: boolean; data: Bonus[] }>(
        '/bonuses/all',
        token,
      )
      setRows(res.data)
      setError(null)
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Failed to load')
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(b: Bonus) {
    setEditing(b)
    setForm({
      title: b.title,
      description: b.description,
      image: b.image,
      bonusType: b.bonusType,
      bonusValue: b.bonusValue ?? '',
      termsAndConditions: b.termsAndConditions ?? '',
      order: b.order,
      isActive: b.isActive,
      validFrom: isoInput(b.validFrom),
      validUntil: isoInput(b.validUntil),
      maxClaims: b.maxClaims ?? 1,
      cooldownHours: b.cooldownHours ?? 0,
    })
    setModalOpen(true)
  }

  async function uploadImage(file: File) {
    if (!token) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await staffFetch('/bonuses/upload-image', token, {
        method: 'POST',
        body: fd,
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok) {
        throw new StaffApiError(res.status, data?.error ?? res.statusText, data)
      }
      const url = data?.data?.url as string | undefined
      if (url) setForm((f) => ({ ...f, image: url }))
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function payload() {
    return {
      title: form.title,
      description: form.description,
      image: form.image,
      bonusType: form.bonusType,
      bonusValue: form.bonusValue || undefined,
      termsAndConditions: form.termsAndConditions || undefined,
      order: form.order,
      isActive: form.isActive,
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
      validUntil: form.validUntil
        ? new Date(form.validUntil).toISOString()
        : undefined,
      maxClaims: form.maxClaims,
      cooldownHours: form.cooldownHours,
    }
  }

  async function save() {
    if (!token) return
    setSaving(true)
    try {
      if (editing) {
        await staffJson(`/bonuses/${editing._id}`, token, {
          method: 'PUT',
          body: JSON.stringify(payload()),
        })
      } else {
        await staffJson('/bonuses', token, {
          method: 'POST',
          body: JSON.stringify(payload()),
        })
      }
      closeModal()
      await load()
      setError(null)
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(b: Bonus) {
    if (!token || !confirm(`Delete bonus “${b.title}”?`)) return
    try {
      await staffJson(`/bonuses/${b._id}`, token, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Delete failed')
    }
  }

  const modalTitle = editing ? 'Edit bonus' : 'New bonus'

  return (
    <div className="space-y-6">
      {/* Dev: was — Public site uses GET /api/bonuses; members claim POST /api/bonuses/:id/claim */}
      <StaffPageHeader
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Add bonus
          </button>
        }
      />

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((b) => (
          <StaffCard key={b._id}>
            <div className="flex gap-3">
              {b.image ? (
                <img
                  src={b.image}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                  No img
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{b.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                    {b.bonusType.replace('_', ' ')}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    Order {b.order}
                  </span>
                  {b.isActive ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-3 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(b)}
                    className="text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </StaffCard>
        ))}
      </div>

      <StaffModal
        open={modalOpen}
        title={modalTitle}
        onClose={closeModal}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </button>
          </div>
        }
      >
        <div className="flex max-h-[min(60vh,480px)] flex-col gap-3 overflow-y-auto pr-1">
          <label className={staffLabelClass}>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={staffInputClass}
            />
          </label>
          <label className={staffLabelClass}>
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className={staffInputClass}
            />
          </label>
          <label className={staffLabelClass}>
            Image URL
            <input
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              className={staffInputClass}
            />
          </label>
          <label className={staffLabelClass}>
            Upload image
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="mt-1 block w-full text-sm text-slate-600"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadImage(f)
                e.target.value = ''
              }}
            />
          </label>
          <label className={staffLabelClass}>
            Type
            <select
              value={form.bonusType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  bonusType: e.target.value as BonusType,
                }))
              }
              className={staffInputClass}
            >
              <option value="welcome">welcome</option>
              <option value="deposit">deposit</option>
              <option value="free_spins">free_spins</option>
              <option value="cashback">cashback</option>
              <option value="other">other</option>
            </select>
          </label>
          <label className={staffLabelClass}>
            Value (display)
            <input
              value={form.bonusValue}
              onChange={(e) =>
                setForm((f) => ({ ...f, bonusValue: e.target.value }))
              }
              className={staffInputClass}
            />
          </label>
          <label className={staffLabelClass}>
            Terms
            <textarea
              value={form.termsAndConditions}
              onChange={(e) =>
                setForm((f) => ({ ...f, termsAndConditions: e.target.value }))
              }
              rows={2}
              className={staffInputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={staffLabelClass}>
              Valid from
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, validFrom: e.target.value }))
                }
                className={staffInputClass}
              />
            </label>
            <label className={staffLabelClass}>
              Valid until
              <input
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) =>
                  setForm((f) => ({ ...f, validUntil: e.target.value }))
                }
                className={staffInputClass}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={staffLabelClass}>
              Max claims / user (0 = unlimited)
              <input
                type="number"
                min={0}
                value={form.maxClaims}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxClaims: Number(e.target.value) }))
                }
                className={staffInputClass}
              />
            </label>
            <label className={staffLabelClass}>
              Cooldown hours (0 = one-time)
              <input
                type="number"
                min={0}
                value={form.cooldownHours}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    cooldownHours: Number(e.target.value),
                  }))
                }
                className={staffInputClass}
              />
            </label>
          </div>
          <label className={staffLabelClass}>
            Sort order
            <input
              type="number"
              value={form.order}
              onChange={(e) =>
                setForm((f) => ({ ...f, order: Number(e.target.value) }))
              }
              className={staffInputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Active
          </label>
        </div>
      </StaffModal>
    </div>
  )
}
