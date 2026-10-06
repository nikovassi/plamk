import type { ReactNode } from 'react'

export function Chip({ active, onClick, children, count }: { active?: boolean; onClick?: () => void; children: ReactNode; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[0.9375rem] font-medium transition-colors duration-200 ${
        active ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink hover:border-ink-3'
      }`}
    >
      {children}
      {count !== undefined && <span className={`tnum text-xs ${active ? 'opacity-70' : 'text-ink-3'}`}>{count}</span>}
    </button>
  )
}

export function Tag({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'inverse' }) {
  const cls =
    tone === 'accent' ? 'bg-accent-soft text-accent' : tone === 'inverse' ? 'bg-white/15 text-white backdrop-blur-sm' : 'bg-surface-2 text-ink-2'
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.8125rem] font-medium ${cls}`}>{children}</span>
}

/** Visible marker for content that must be supplied by the company. */
export function Placeholder({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-dashed border-accent/60 bg-accent-soft/60 px-2 py-0.5 text-[0.8125rem] font-medium text-accent ${className}`}>
      <span aria-hidden="true">◇</span>
      <span>{children}</span>
    </span>
  )
}
