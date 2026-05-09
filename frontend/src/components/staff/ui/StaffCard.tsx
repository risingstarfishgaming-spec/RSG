import type { ReactNode } from 'react'

type StaffCardProps = {
  children: ReactNode
  className?: string
}

export function StaffCard({ children, className = '' }: StaffCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md ${className}`}
    >
      {children}
    </div>
  )
}
