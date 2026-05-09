import type { ReactNode } from 'react'

type StaffPageHeaderProps = {
  /** Omit when the shell sticky header already shows this section title. */
  title?: string
  description?: ReactNode
  actions?: ReactNode
}

export function StaffPageHeader({
  title,
  description,
  actions,
}: StaffPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {title ? (
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
        ) : null}
        {description ? (
          <div
            className={
              title
                ? 'mt-2 max-w-2xl text-sm text-slate-600'
                : 'max-w-2xl text-sm text-slate-600'
            }
          >
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
