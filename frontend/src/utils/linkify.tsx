import type { ReactNode } from 'react'

const urlRx = /(https?:\/\/[^\s]+)/g

const defaultLinkClass = 'break-all text-[#FFD54A] underline'

export type LinkifyOptions = {
  linkClassName?: string
}

export function linkify(text: string, options?: LinkifyOptions): ReactNode[] {
  const linkClass = options?.linkClassName ?? defaultLinkClass
  const parts = text.split(urlRx)
  return parts.map((part, i) => {
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          {part}
        </a>
      )
    }
    return part
  })
}
