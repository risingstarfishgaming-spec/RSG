import { useEffect, useMemo, useRef, useState, type FC } from 'react'

export interface LabelData {
  _id: string
  name: string
  color: string
}

/** Avoid `.trim()` on non-strings (API may send numeric or null color) — that throws and blanks the whole chat tree. */
function normalizeLabelColor(raw: unknown): string {
  if (typeof raw === 'string') {
    const t = raw.trim()
    return t.length > 0 ? t : '#6b7280'
  }
  return '#6b7280'
}

interface LabelBadgeProps {
  label: LabelData
  size?: 'sm' | 'md'
  onRemove?: () => void
}

const LabelBadge: FC<LabelBadgeProps> = ({ label, size = 'sm', onRemove }) => {
  const sizeClasses =
    size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-1 gap-1.5'
  const color = normalizeLabelColor(label.color)

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} transition-colors`}
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className={`rounded-full flex-shrink-0 ${size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'}`}
        style={{ backgroundColor: color }}
      />
      {label.name}
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 font-bold leading-none transition-opacity hover:opacity-70"
          style={{ color }}
        >
          &times;
        </button>
      ) : null}
    </span>
  )
}

interface LabelSelectorProps {
  allLabels: LabelData[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
}

function safeLabelsList(labels: LabelData[] | null | undefined): LabelData[] {
  if (!Array.isArray(labels)) return []
  return labels
    .filter(
      (l): l is LabelData =>
        Boolean(
          l &&
            typeof l === 'object' &&
            typeof l._id === 'string' &&
            l._id.length > 0 &&
            typeof l.name === 'string',
        ),
    )
    .map((l) => ({ ...l, color: normalizeLabelColor(l.color) }))
}

function safeSelectedIds(ids: string[] | null | undefined): string[] {
  if (!Array.isArray(ids)) return []
  return ids.filter((i): i is string => typeof i === 'string' && i.length > 0)
}

export const LabelSelector: FC<LabelSelectorProps> = ({
  allLabels,
  selectedIds,
  onChange,
  loading,
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const labels = useMemo(() => safeLabelsList(allLabels), [allLabels])
  const selected = useMemo(() => safeSelectedIds(selectedIds), [selectedIds])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((i) => i !== id) : [...selected, id],
    )
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-white/10"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        Labels
        {selected.length > 0 ? (
          <span className="rounded-full bg-blue-500/30 px-1.5 text-[10px] font-bold text-blue-300">
            {selected.length}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="animate-fade-in absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-lg border border-white/10 bg-[#1a1a2e] shadow-xl">
          <div className="border-b border-white/10 p-2">
            <span className="text-xs font-medium text-gray-400">Assign Labels</span>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {labels.length === 0 ? (
              <p className="p-2 text-center text-xs text-gray-500">No labels created</p>
            ) : (
              labels.map((label) => {
                const swatch = normalizeLabelColor(label.color)
                return (
                  <label
                    key={label._id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(label._id)}
                      onChange={() => toggle(label._id)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30"
                    />
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: swatch }}
                    />
                    <span className="truncate text-xs text-gray-200">{label.name}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface LabelFilterProps {
  allLabels: LabelData[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export const LabelFilter: FC<LabelFilterProps> = ({ allLabels, selectedIds, onChange }) => {
  const labels = safeLabelsList(allLabels)
  const selected = safeSelectedIds(selectedIds)
  if (labels.length === 0) return null

  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((i) => i !== id) : [...selected, id],
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selected.length > 0 ? (
        <button
          type="button"
          onClick={() => onChange([])}
          className="px-1 text-[10px] text-gray-500 transition-colors hover:text-gray-300"
        >
          Clear
        </button>
      ) : null}
      {labels.map((label) => {
        const active = selected.includes(label._id)
        const c = normalizeLabelColor(label.color)
        return (
          <button
            key={label._id}
            type="button"
            onClick={() => toggle(label._id)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all ${
              active
                ? 'border-current shadow-sm'
                : 'border-transparent opacity-60 hover:opacity-90'
            }`}
            style={{
              backgroundColor: active ? `${c}25` : `${c}10`,
              color: c,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: c }}
            />
            {label.name}
          </button>
        )
      })}
    </div>
  )
}

export default LabelBadge
