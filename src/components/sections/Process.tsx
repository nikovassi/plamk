import { site } from '../../content/site'

const steps = [
  { t: 'Запитване', d: 'Тип обект, материал, площ и снимки или чертеж — за около минута.' },
  { t: 'Преглед и оглед', d: 'Преглеждаме информацията и уточняваме детайлите по телефона или на място.' },
  { t: 'Оферта', d: 'Получавате оферта с материал, система и срок за изпълнение.' },
  { t: 'Изпълнение', d: 'Проектиране, доставка, изработка и монтаж от един екип.' },
]

export function Process() {
  return (
    <section className="container-x my-16 md:my-24" aria-labelledby="process-title">
      <div className="mb-8 max-w-3xl reveal">
        <p className="eyebrow mb-3">Как работим</p>
        <h2 id="process-title" className="h-section">От снимка до готова фасада</h2>
        {site.responseTime && <p className="mt-4 text-lg text-ink-2">Отговор на запитване: {site.responseTime}</p>}
      </div>
      <ol className="grid gap-3 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.t} className="reveal rounded-[22px] border border-line bg-surface p-5" style={{ ['--d' as string]: `${i * 90}ms` }}>
            <span className="tnum text-sm font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-6 text-xl">{s.t}</h3>
            <p className="mt-2 text-[0.9375rem] text-ink-2">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
