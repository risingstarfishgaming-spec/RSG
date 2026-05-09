import type { ReactNode } from 'react'

export function AuthFormCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/35 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:rounded-3xl sm:p-7">
      {children}
    </div>
  )
}
