import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { getService, services } from '../content/services'
import { projects } from '../content/projects'
import { materialLabels } from '../content/labels'
import { Media } from '../components/media/Media'
import { Gallery } from '../components/media/Gallery'
import { ProjectCard } from '../components/cards/ProjectCard'
import { CtaBand } from '../components/sections/CtaBand'
import { Breadcrumbs } from '../components/sections/PageHero'
import { ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { projectsForService } from '../lib/filters'
import { breadcrumbLd, serviceLd, useSeo } from '../lib/seo'
import { track } from '../lib/analytics'
import NotFound from './NotFound'

const quoteService: Record<string, string> = { proektirane: 'design', dostavka: 'supply', montazh: 'install' }

export default function ServiceDetail() {
  const { slug = '' } = useParams()
  const s = getService(slug)
  useEffect(() => { if (s) track('service_view', { service: s.slug }) }, [s])
  if (!s) return <NotFound />
  return <ServiceView key={s.id} s={s} />
}

function ServiceView({ s }: { s: NonNullable<ReturnType<typeof getService>> }) {
  const path = `/uslugi/${s.slug}`
  useSeo({
    title: s.seoTitle,
    description: s.seoDescription,
    path,
    jsonLd: [serviceLd({ ...s, path }), breadcrumbLd([{ name: 'Начало', path: '/' }, { name: 'Услуги', path: '/uslugi' }, { name: s.name, path }])],
  })
  const related = projectsForService(projects, s.slug)
  const mat = s.group === 'metal' ? '&material=metal' : s.materials?.length === 1 ? `&material=${s.materials[0]}` : ''
  const q = `/zapitvane?ot=usluga-${s.slug}${quoteService[s.slug] ? `&usluga=${quoteService[s.slug]}` : ''}${mat}`
  const others = services.filter((x) => x.slug !== s.slug && x.group === s.group).slice(0, 4)

  return (
    <article>
      <header className="relative isolate overflow-hidden bg-[#141517] text-white">
        <Media image={s.cover} priority className="absolute inset-0 h-full w-full opacity-80 anim-kenburns" label={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/40" aria-hidden="true" />
        <div className="container-x relative flex min-h-[78svh] flex-col justify-end pb-10 pt-28 md:pb-16">
          <Breadcrumbs inverse items={[{ name: 'Начало', to: '/' }, { name: 'Услуги', to: '/uslugi' }, { name: s.name, to: path }]} />
          <h1 className="display max-w-4xl !text-[clamp(2.5rem,8.5vw,5.5rem)] anim-rise">{s.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85 anim-rise md:text-xl" style={{ ['--d' as string]: '100ms' }}>{s.shortDescription}</p>
          <div className="mt-7 flex flex-col gap-3 anim-rise sm:flex-row" style={{ ['--d' as string]: '180ms' }}>
            <ButtonLink to={q} size="lg" icon="arrow" cta={`service-${s.slug}`}>Поискай оферта</ButtonLink>
            {related.length > 0 && <ButtonLink to={`/proekti?service=${s.slug}`} size="lg" variant="outline-inverse">Виж проектите</ButtonLink>}
          </div>
        </div>
      </header>

      <section className="container-x grid gap-10 py-12 md:grid-cols-2 md:py-20">
        <div className="reveal">
          <p className="text-xl leading-snug md:text-2xl">{s.description}</p>
          {s.materials && s.materials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {s.materials.map((m) => (
                <span key={m} className="inline-flex h-11 items-center rounded-full bg-surface-2 px-4 font-medium">{materialLabels[m]}</span>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-8">
          <div className="reveal">
            <h2 className="eyebrow mb-3">Предимства</h2>
            <ul className="grid gap-2">
              {s.features.map((f) => (
                <li key={f} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4"><Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />{f}</li>
              ))}
            </ul>
          </div>
          <div className="reveal">
            <h2 className="eyebrow mb-3">Подходящо за</h2>
            <ul className="flex flex-wrap gap-2">{s.applications.map((a) => <li key={a} className="rounded-full bg-surface-2 px-4 py-2">{a}</li>)}</ul>
          </div>
        </div>
      </section>

      {s.gallery.length > 0 && (
        <section className="pb-12" aria-labelledby="g">
          <h2 id="g" className="container-x mb-6 text-3xl">Галерия</h2>
          <Gallery images={s.gallery} title={`Галерия: ${s.name}`} />
        </section>
      )}

      {related.length > 0 && (
        <section className="pb-4" aria-labelledby="rp">
          <h2 id="rp" className="container-x mb-6 text-3xl">Изпълнени проекти</h2>
          <ul className="snap-row rail md:grid-cols-3 md:gap-4">
            {related.slice(0, 6).map((p) => <li key={p.id} className="w-[80vw] max-w-sm md:w-auto md:max-w-none"><ProjectCard p={p} /></li>)}
          </ul>
        </section>
      )}

      <CtaBand from={`service-${s.slug}`} title={`Нуждаете се от „${s.name}“?`} />

      {others.length > 0 && (
        <nav className="container-x pb-8" aria-label="Други услуги">
          <h2 className="eyebrow mb-3">Други услуги</h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((o) => <li key={o.slug}><Link to={`/uslugi/${o.slug}`} className="inline-flex h-11 items-center rounded-full border border-line px-4 font-medium hover:border-ink-3">{o.name}</Link></li>)}
          </ul>
        </nav>
      )}
    </article>
  )
}
