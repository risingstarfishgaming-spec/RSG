import type { ReactNode } from 'react'

type StaffModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function StaffModal({
  open,
  title,
  onClose,
  children,
  footer,
}: StaffModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-modal-title"
        className="flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-none bg-white shadow-2xl ring-1 ring-slate-200/80 sm:rounded-xl max-sm:max-h-[min(92dvh,900px)] max-sm:rounded-t-2xl max-sm:rounded-b-none"
      >
        <div className="flex shrink-0 items-start justify-between bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white">
          <h2
            id="staff-modal-title"
            className="text-lg font-semibold tracking-tight"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/15"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
