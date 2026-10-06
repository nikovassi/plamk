import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { projects } from '../content/projects'
import { buildingTypeLabels, materialLabels, serviceLabels } from '../content/labels'
import type { BuildingType, MaterialKey, ServiceKey } from '../content/types'
import { filterOptions, filterProjects, parseFilter, type ProjectFilter } from '../lib/filters'
import { ProjectCard } from '../components/cards/ProjectCard'
import { Chip } from '../components/ui/Chip'
import { Sheet } from '../components/ui/Sheet'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { CtaBand } from '../components/sections/CtaBand'
import { PageHero } from '../components/sections/PageHero'
import { breadcrumbLd, useSeo } from '../lib/seo'

export default function Projects() {
  useSeo({
    title: 'Проекти — изпълнени фасади от Al Bond, HPL и керамика',
    description: 'Портфолио с изпълнени фасадни облицовки и вентилируеми фасади: филтрирайте по материал, тип сграда, услуга и локация.',
    path: '/proekti',
    jsonLd: [breadcrumbLd([{ name: 'Начало', path: '/' }, { name: 'Проекти', path: '/proekti' }])],
  })
  const [params, setParams] = useSearchParams()
  const filter = parseFilter(params)
  const [sheet, setSheet] = useState(false)
  const opts = useMemo(() => filterOptions(projects), [])
  const list = filterProjects(projects, filter)

  const set = (patch: Partial<ProjectFilter>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true, preventScrollReset: true })
  }
  const extraCount = (filter.service ? 1 : 0) + (filter.city ? 1 : 0)
  const countFor = (patch: Partial<ProjectFilter>) => filterProjects(projects, { ...filter, ...patch }).length

  return (
    <>
      <PageHero eyebrow="Портфолио" title="Проекти" intro="Изпълнени обекти — материал, услуга и локация на всеки проект." />

      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 border-b border-line bg-bg/90 py-3 backdrop-blur-xl lg:top-20" role="region" aria-label="Филтри">
        <div className="snap-row !gap-2" role="group" aria-label="Материал">
          <Chip active={!filter.material} onClick={() => set({ material: undefined })}>Всички</Chip>
          {opts.materials.map((m) => (
            <Chip key={m} active={filter.material === m} onClick={() => set({ material: filter.material === m ? undefined : (m as MaterialKey) })} count={countFor({ material: m })}>
              {materialLabels[m]}
            </Chip>
          ))}
        </div>
        <div className="snap-row mt-2 !gap-2" role="group" aria-label="Тип сграда">
          <button type="button" onClick={() => setSheet(true)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface-2 px-4 text-[0.9375rem] font-medium">
            <Icon name="menu" className="h-4 w-4" /> Още филтри{extraCount ? ` · ${extraCount}` : ''}
          </button>
          {opts.types.map((t) => (
            <Chip key={t} active={filter.type === t} onClick={() => set({ type: filter.type === t ? undefined : (t as BuildingType) })}>
              {buildingTypeLabels[t]}
            </Chip>
          ))}
        </div>
      </div>

      <section className="container-x py-8" aria-live="polite" aria-labelledby="list-title">
        <h2 id="list-title" className="sr-only">Списък с проекти</h2>
        <p className="mb-5 text-ink-2" data-testid="project-count">
          {list.length} {list.length === 1 ? 'проект' : 'проекта'}
          {Object.keys(filter).length > 0 && (
            <button type="button" className="ml-3 font-semibold text-accent underline-offset-4 hover:underline" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              Изчисти филтрите
            </button>
          )}
        </p>
        {list.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => <li key={p.id}><ProjectCard p={p} priority={i < 2} /></li>)}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center">
            <p className="text-lg">Няма проекти с тези филтри.</p>
            <Button variant="ghost" className="mt-4" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Покажи всички</Button>
          </div>
        )}
      </section>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Филтри">
        <fieldset>
          <legend className="eyebrow mb-3">Услуга</legend>
          <div className="flex flex-wrap gap-2">
            <Chip active={!filter.service} onClick={() => set({ service: undefined })}>Всички</Chip>
            {opts.services.map((s) => (
              <Chip key={s} active={filter.service === s} onClick={() => set({ service: filter.service === s ? undefined : (s as ServiceKey) })}>{serviceLabels[s]}</Chip>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className="eyebrow mb-3">Локация</legend>
          <div className="flex flex-wrap gap-2">
            <Chip active={!filter.city} onClick={() => set({ city: undefined })}>Всички</Chip>
            {opts.cities.map((c) => <Chip key={c} active={filter.city === c} onClick={() => set({ city: filter.city === c ? undefined : c })}>{c}</Chip>)}
          </div>
        </fieldset>
        <Button className="mt-8 w-full" size="lg" onClick={() => setSheet(false)}>Покажи {list.length} {list.length === 1 ? 'проект' : 'проекта'}</Button>
      </Sheet>

      <CtaBand from="projects" title="Имате подобен проект?" />
    </>
  )
}
