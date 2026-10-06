import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function PageHero({ eyebrow, title, intro, crumbs, children }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; crumbs?: { name: string; to: string }[]; children?: ReactNode }) {
  return (
    <header className="container-x pb-6 pt-[calc(6rem+env(safe-area-inset-top))] md:pb-10 lg:pt-32">
      {crumbs && <Breadcrumbs items={crumbs} />}
      {eyebrow && <p className="eyebrow mb-3 anim-rise">{eyebrow}</p>}
      <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] anim-rise" style={{ ['--d' as string]: '60ms' }}>{title}</h1>
      {intro && <p className="mt-5 max-w-2xl text-lg text-ink-2 anim-rise md:text-xl" style={{ ['--d' as string]: '140ms' }}>{intro}</p>}
      {children}
    </header>
  )
}

export function Breadcrumbs({ items, inverse }: { items: { name: string; to: string }[]; inverse?: boolean }) {
  return (
    <nav aria-label="Навигационна пътека" className="mb-4">
      <ol className={`flex flex-wrap items-center gap-1.5 text-sm ${inverse ? 'text-white/70' : 'text-ink-3'}`}>
        {items.map((it, i) => (
          <li key={it.to} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i < items.length - 1 ? <Link to={it.to} className="hover:underline">{it.name}</Link> : <span aria-current="page">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
