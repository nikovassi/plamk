import type { DocumentItem } from '../../content/types'
import { documentCategoryLabels } from '../../content/documents'
import { asset } from '../../lib/paths'
import { track } from '../../lib/analytics'
import { Icon } from '../ui/Icon'

export function DownloadCard({ d }: { d: DocumentItem }) {
  const available = Boolean(d.href)
  const href = d.href ? (/^https?:/.test(d.href) ? d.href : asset(d.href)) : undefined
  const body = (
    <>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xs font-bold uppercase ${available ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-ink-3'}`}>{d.kind}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{d.title}</span>
        <span className="mt-1 block text-sm text-ink-3">
          {documentCategoryLabels[d.category]}
          {d.sizeLabel ? ` · ${d.sizeLabel}` : ''}
          {!available && ' · очаква се файл'}
        </span>
      </span>
      <Icon name="download" className={`h-5 w-5 shrink-0 ${available ? '' : 'opacity-30'}`} />
    </>
  )
  const cls = 'flex min-h-20 items-center gap-4 rounded-2xl border border-line bg-surface p-4'
  return available ? (
    <a href={href} className={`${cls} transition-colors hover:border-ink-3`} download={!/^https?:/.test(d.href!)} onClick={() => track('download_click', { doc: d.id })}>
      {body}
    </a>
  ) : (
    <div className={`${cls} border-dashed`} aria-disabled="true">
      {body}
    </div>
  )
}
