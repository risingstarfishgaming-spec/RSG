import { useCallback, useEffect, useState } from 'react'
import { Edit2, Loader2, Plus, Tag, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { StaffCard } from '../../components/staff/ui/StaffCard'
import { StaffModal } from '../../components/staff/ui/StaffModal'
import { StaffPageHeader } from '../../components/staff/ui/StaffPageHeader'
import { staffInputClass } from '../../components/staff/ui/staffFormStyles'
import { useStaffAuthStore } from '../../stores/staffAuthStore'
import { staffJson, StaffApiError } from '../../services/staffApi'

type Label = { id: string; name: string; color: string }

const COLOR_PALETTE = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#6B7280',
  '#14B8A6',
]

const emptyForm = { name: '', color: '#3B82F6' }

export function AdminLabelsPage() {
  const token = useStaffAuthStore((s) => s.admin?.token ?? null)
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Label | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await staffJson<{ success: boolean; data: Label[] }>(
        '/admin/labels',
        token,
      )
      setLabels(res.data)
    } catch (e) {
      toast.error(e instanceof StaffApiError ? e.message : 'Failed to load labels')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(label: Label) {
    setEditing(label)
    setForm({ name: label.name, color: label.color })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  async function saveLabel(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !form.name.trim()) {
      toast.error('Label name is required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const res = await staffJson<{ success: boolean; data: Label }>(
          `/admin/labels/${editing.id}`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify(form),
          },
        )
        setLabels((prev) => prev.map((l) => (l.id === editing.id ? res.data : l)))
        toast.success('Label updated')
      } else {
        const res = await staffJson<{ success: boolean; data: Label }>(
          '/admin/labels',
          token,
          {
            method: 'POST',
            body: JSON.stringify(form),
          },
        )
        setLabels((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)))
        toast.success('Label created')
      }
      closeModal()
    } catch (err) {
      toast.error(err instanceof StaffApiError ? err.message : 'Failed to save label')
    } finally {
      setSaving(false)
    }
  }

  async function deleteLabel(id: string) {
    if (!token) return
    if (!window.confirm('Delete this label? It will be removed from all members.')) return
    try {
      await staffJson(`/admin/labels/${id}`, token, { method: 'DELETE' })
      setLabels((prev) => prev.filter((l) => l.id !== id))
      toast.success('Label deleted')
    } catch (err) {
      toast.error(err instanceof StaffApiError ? err.message : 'Failed to delete label')
    }
  }

  return (
    <div className="space-y-6">
      <StaffPageHeader
        description="Create and manage CRM labels for members. Use labels in Email promotions and on agent client profiles."
      />

      <StaffCard className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Label catalog</h2>
          <p className="mt-1 text-sm text-slate-500">
            {labels.length} label{labels.length === 1 ? '' : 's'} in the system
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add label
        </button>
      </StaffCard>

      <StaffCard className="overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
          </div>
        ) : labels.length === 0 ? (
          <div className="py-16 text-center">
            <Tag className="mx-auto mb-3 h-12 w-12 text-slate-300" aria-hidden />
            <p className="font-medium text-slate-600">No labels yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Labels help you categorize members for SMS and agent workflows.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Create your first label
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {labels.map((label) => (
              <li
                key={label.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: label.color }}
                    aria-hidden
                  />
                  <span className="truncate text-sm font-medium text-slate-900">
                    {label.name}
                  </span>
                  <span className="hidden font-mono text-xs text-slate-400 sm:inline">
                    {label.color}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(label)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteLabel(label.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </StaffCard>

      <StaffModal
        open={modalOpen}
        title={editing ? 'Edit label' : 'Create label'}
        onClose={closeModal}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="label-form"
              disabled={saving || !form.name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        }
      >
        <form id="label-form" onSubmit={saveLabel} className="space-y-4">
          <div>
            <label htmlFor="label-name" className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="label-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={80}
              placeholder="e.g. VIP, Lead, Follow-up"
              className={staffInputClass}
              required
            />
          </div>
          <div>
            <p className="mb-2 block text-sm font-medium text-slate-700">Color</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    form.color === c
                      ? 'scale-110 border-slate-900 shadow-md'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">Custom:</span>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-8 w-8 cursor-pointer rounded border border-slate-200"
                aria-label="Custom color"
              />
              <span className="font-mono text-xs text-slate-500">{form.color}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Preview:</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${form.color}20`,
                color: form.color,
                border: `1px solid ${form.color}40`,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: form.color }}
                aria-hidden
              />
              {form.name.trim() || 'Label'}
            </span>
          </div>
        </form>
      </StaffModal>
    </div>
  )
}
