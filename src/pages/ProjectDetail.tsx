import { useEffect } from 'react'
import { useParams } from 'react-router'
import { getProject, projects } from '../content/projects'
import { buildingTypeSingular, materialLabels, serviceLabels } from '../content/labels'
import { Media } from '../components/media/Media'
import { Gallery } from '../components/media/Gallery'
import { BeforeAfter } from '../components/media/BeforeAfter'
import { ProjectCard } from '../components/cards/ProjectCard'
import { DownloadCard } from '../components/cards/DownloadCard'
import { CtaBand } from '../components/sections/CtaBand'
import { Breadcrumbs } from '../components/sections/PageHero'
import { relatedProjects } from '../lib/filters'
import { breadcrumbLd, projectLd, useSeo } from '../lib/seo'
import { track } from '../lib/analytics'
import NotFound from './NotFound'

export default function ProjectDetail() {
  const { slug = '' } = useParams()
  const p = getProject(slug)
  useEffect(() => {
    if (p) track('project_view', { project: p.slug })
  }, [p])
  if (!p) return <NotFound />
  return <ProjectView key={p.id} p={p} />
}

function ProjectView({ p }: { p: NonNullable<ReturnType<typeof getProject>> }) {
  useSeo({
    title: `${p.title}${p.location.city ? `, ${p.location.city}` : ''} — ${p.materials.map((m) => materialLabels[m]).join(' + ')}`,
    description: `${p.summary} ${buildingTypeSingular[p.type]}${p.location.city ? ` в ${p.location.city}` : ''}. Материали: ${p.materials.map((m) => materialLabels[m]).join(', ')}.`,
    path: `/proekti/${p.slug}`,
    noindex: p.isPlaceholder,
    jsonLd: [projectLd(p), breadcrumbLd([{ name: 'Начало', path: '/' }, { name: 'Проекти', path: '/proekti' }, { name: p.title, path: `/proekti/${p.slug}` }])],
  })
  const related = relatedProjects(projects, p)
  const facts = ([
    ['Локация', p.location.city],
    ['Тип обект', buildingTypeSingular[p.type]],
    ['Материали', p.materials.map((m) => materialLabels[m]).join(' + ')],
    ['Услуги', p.services.map((s) => serviceLabels[s]).join(', ')],
    ['Година', p.year],
    ['Площ', p.area ? `${p.area.toLocaleString('bg-BG')} m²` : null],
  ] as [string, React.ReactNode][]).filter(([, v]) => v !== undefined && v !== null && v !== '')

  return (
    <article>
      <header className="relative isolate flex min-h-[88svh] flex-col justify-end overflow-hidden bg-[#141517] text-white">
        <Media image={p.cover} priority className="absolute inset-0 h-full w-full anim-kenburns" label={p.isPlaceholder ? 'Примерен обект · placeholder' : false} labelClassName="right-3 top-[calc(4.75rem+env(safe-area-inset-top))] lg:top-24" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30" aria-hidden="true" />
        <div className="container-x relative pb-10 pt-28 md:pb-16">
          <Breadcrumbs inverse items={[{ name: 'Начало', to: '/' }, { name: 'Проекти', to: '/proekti' }, { name: p.title, to: `/proekti/${p.slug}` }]} />
          <p className="text-white/80 anim-rise">{p.location.city && `${p.location.city} · `}{buildingTypeSingular[p.type]}</p>
          <h1 className="display mt-2 max-w-5xl !text-[clamp(2.6rem,9vw,5.5rem)] anim-rise" style={{ ['--d' as string]: '80ms' }}>{p.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85 anim-rise" style={{ ['--d' as string]: '160ms' }}>{p.summary}</p>
        </div>
      </header>

      <section className="container-x grid gap-10 py-12 md:grid-cols-[1fr_1.5fr] md:py-20" aria-label="Данни за проекта">
        <dl className="grid h-fit grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-line bg-line md:sticky md:top-28 md:grid-cols-1">
          {facts.map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="text-sm text-ink-3">{k}</dt>
              <dd className="mt-1 font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-10">
          <div className="reveal">
            <h2 className="text-3xl">За проекта</h2>
            <p className="mt-4 text-lg text-ink-2">{p.description}</p>
          </div>
          {p.challenge && (
            <div className="reveal">
              <p className="eyebrow mb-2">Предизвикателство</p>
              <p className="text-xl leading-snug">{p.challenge}</p>
            </div>
          )}
          {p.solution && (
            <div className="reveal">
              <p className="eyebrow mb-2">Решение</p>
              <p className="text-xl leading-snug">{p.solution}</p>
            </div>
          )}
          {p.execution && p.execution.length > 0 && (
            <div className="reveal">
              <p className="eyebrow mb-4">Изпълнение</p>
              <ol className="grid gap-2">
                {p.execution.map((e, i) => (
                  <li key={e} className="flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
                    <span className="tnum text-sm font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-medium">{e}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>

      {p.beforeAfter && (
        <section className="container-x pb-12" aria-labelledby="ba">
          <h2 id="ba" className="mb-6 text-3xl">Преди и след</h2>
          <BeforeAfter before={p.beforeAfter.before} after={p.beforeAfter.after} />
        </section>
      )}

      <section className="pb-12" aria-labelledby="gallery">
        <h2 id="gallery" className="container-x mb-6 text-3xl">Галерия</h2>
        <Gallery images={p.gallery} title={`Галерия: ${p.title}`} />
      </section>

      {((p.technicalDetails?.length ?? 0) > 0 || (p.technicalDocuments?.length ?? 0) > 0) && (
        <section className="container-x pb-8" aria-labelledby="tech">
          <h2 id="tech" className="mb-4 text-3xl">Технически детайли</h2>
          {p.technicalDetails && p.technicalDetails.length > 0 && (
            <dl className="grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2">
              {p.technicalDetails.map((t) => (
                <div key={t.label} className="bg-surface p-4"><dt className="text-sm text-ink-3">{t.label}</dt><dd className="mt-1 font-semibold">{t.value}</dd></div>
              ))}
            </dl>
          )}
          {p.technicalDocuments && p.technicalDocuments.length > 0 && (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">{p.technicalDocuments.map((d) => <li key={d.id}><DownloadCard d={d} /></li>)}</ul>
          )}
        </section>
      )}

      <CtaBand from={`project-${p.slug}`} title="Имате подобен проект?" text="Изпратете снимки или чертеж на вашата сграда — ще предложим решение с подходящ материал." />

      {related.length > 0 && (
        <section className="pb-8" aria-labelledby="related">
          <h2 id="related" className="container-x mb-6 text-3xl">Свързани проекти</h2>
          <ul className="snap-row rail md:grid-cols-3 md:gap-4">
            {related.map((r) => <li key={r.id} className="w-[80vw] max-w-sm md:w-auto md:max-w-none"><ProjectCard p={r} /></li>)}
          </ul>
        </section>
      )}
    </article>
  )
}
