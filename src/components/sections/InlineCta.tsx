import { Link } from 'react-router'
import { Icon } from '../ui/Icon'
import { track } from '../../lib/analytics'

/** Low-key CTA line between sections (keeps the primary action present without repeating big banners). */
export function InlineCta({ text, label = 'Поискай оферта', to, from }: { text: string; label?: string; to: string; from: string }) {
  return (
    <div className="container-x mt-8">
      <Link to={to} onClick={() => track('cta_click', { cta: `inline-${from}` })} className="group flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4 transition-colors hover:border-ink-3">
        <span className="text-[1.0625rem] text-ink-2">{text}</span>
        <span className="inline-flex shrink-0 items-center gap-2 font-semibold text-accent">
          <span className="hidden sm:inline">{label}</span>
          <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </div>
  )
}
