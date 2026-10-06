import { areaOptions, hasProjectOptions, labelOf, materialOptions, projectTypeOptions, serviceOptions, type LeadDraft } from '../../lib/lead/schema'
import { formatBytes, type Attachment } from '../../lib/lead/files'
import { Icon } from '../../components/ui/Icon'
import type { StepKey } from './QuoteWizard'

export function Summary({ data, files, onEdit }: { data: LeadDraft; files: Attachment[]; onEdit: (k: StepKey) => void }) {
  const rows: { k: StepKey; label: string; value: React.ReactNode }[] = [
    { k: 'projectType', label: 'Тип обект', value: labelOf(projectTypeOptions, data.projectType) },
    { k: 'materials', label: 'Материал', value: (data.materials ?? []).map((m) => labelOf(materialOptions, m)).join(', ') || '—' },
    { k: 'service', label: 'Услуга', value: labelOf(serviceOptions, data.service) },
    { k: 'scope', label: 'Площ', value: `${labelOf(areaOptions, data.area)} · Проект: ${labelOf(hasProjectOptions, data.hasProject)}` },
    { k: 'location', label: 'Локация', value: [data.city, data.address].filter(Boolean).join(', ') + (data.gps ? ' · GPS' : '') || '—' },
    {
      k: 'files',
      label: 'Прикачени файлове',
      value: files.length ? (
        <ul>{files.map((f) => <li key={f.id} className="truncate">{f.file.name} <span className="text-ink-3">· {formatBytes(f.file.size)}</span></li>)}</ul>
      ) : 'Няма',
    },
    {
      k: 'contact',
      label: 'Контакт',
      value: (
        <>
          {data.name}{data.company ? `, ${data.company}` : ''}
          <br />{data.phone}{data.email ? <><br />{data.email}</> : null}
          {data.message ? <span className="mt-2 block whitespace-pre-line text-ink-2">„{data.message}“</span> : null}
        </>
      ),
    },
  ]
  return (
    <section aria-labelledby="sum-title">
      <h1 id="sum-title" tabIndex={-1} className="text-[clamp(1.75rem,6vw,2.5rem)] outline-none">Вашето запитване</h1>
      <p className="mt-2 text-ink-2">Проверете данните преди изпращане.</p>
      <dl className="mt-6 divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-surface" data-testid="summary">
        {rows.map((r) => (
          <div key={r.k} className="flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <dt className="text-sm text-ink-3">{r.label}</dt>
              <dd className="mt-1 break-words font-medium">{r.value}</dd>
            </div>
            <button type="button" onClick={() => onEdit(r.k)} className="-mr-1 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.9375rem] font-semibold text-accent hover:bg-accent-soft" aria-label={`Редактирай: ${r.label}`}>
              <Icon name="edit" className="h-4 w-4" /> Редактирай
            </button>
          </div>
        ))}
      </dl>
    </section>
  )
}
