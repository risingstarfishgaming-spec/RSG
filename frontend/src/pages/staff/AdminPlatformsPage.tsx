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

type Platform = {
  _id: string
  name: string
  description: string
  image: string
  gameLink: string
  isActive: boolean
  order: number
}

const emptyForm = {
  name: '',
  description: '',
  image: '',
  gameLink: '',
  order: 0,
  isActive: true,
}

export function AdminPlatformsPage() {
  const token = useStaffAuthStore((s) => s.admin?.token ?? null)
  const [rows, setRows] = useState<Platform[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Platform | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const res = await staffJson<{ success: boolean; data: Platform[] }>(
        '/platforms/all',
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

  function openEdit(p: Platform) {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description,
      image: p.image,
      gameLink: p.gameLink,
      order: p.order,
      isActive: p.isActive,
    })
    setModalOpen(true)
  }

  async function uploadImage(file: File) {
    if (!token) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await staffFetch('/platforms/upload-image', token, {
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

  async function save() {
    if (!token) return
    setSaving(true)
    try {
      if (editing) {
        await staffJson(`/platforms/${editing._id}`, token, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      } else {
        await staffJson('/platforms', token, {
          method: 'POST',
          body: JSON.stringify(form),
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

  async function remove(p: Platform) {
    if (!token || !confirm(`Delete platform “${p.name}”?`)) return
    try {
      await staffJson(`/platforms/${p._id}`, token, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : 'Delete failed')
    }
  }

  const modalTitle = editing ? 'Edit platform' : 'New platform'

  return (
    <div className="space-y-6">
      {/* Dev: was — GET /api/platforms; Cloudinary note */}
      <StaffPageHeader
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Add platform
          </button>
        }
      />

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((p) => (
          <StaffCard key={p._id}>
            <div className="flex gap-3">
              {p.image ? (
                <img
                  src={p.image}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                  No img
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{p.name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    Order {p.order}
                  </span>
                  {p.isActive ? (
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
                    onClick={() => openEdit(p)}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
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
        <div className="flex flex-col gap-3">
          <label className={staffLabelClass}>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
            Game link
            <input
              value={form.gameLink}
              onChange={(e) =>
                setForm((f) => ({ ...f, gameLink: e.target.value }))
              }
              className={staffInputClass}
            />
          </label>
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
            Active (shown on public site)
          </label>
        </div>
      </StaffModal>
    </div>
  )
}
