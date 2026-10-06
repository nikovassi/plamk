import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

export function SectionHead({ eyebrow, title, intro, link, id }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; link?: { to: string; label: string }; id?: string }) {
  return (
    <div className="container-x mb-6 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl reveal">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="h-section">{title}</h2>
        {intro && <p className="mt-4 max-w-2xl text-lg text-ink-2">{intro}</p>}
      </div>
      {link && (
        <Link to={link.to} className="group inline-flex min-h-11 items-center gap-2 self-start font-semibold text-ink md:self-auto">
          {link.label}
          <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
