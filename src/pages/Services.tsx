import { Link } from 'react-router'
import { services } from '../content/services'
import { ServiceCard } from '../components/cards/ServiceCard'
import { PageHero } from '../components/sections/PageHero'
import { CtaBand } from '../components/sections/CtaBand'
import { Icon } from '../components/ui/Icon'
import { Process } from '../components/sections/Process'
import { breadcrumbLd, useSeo } from '../lib/seo'

export default function Services() {
  useSeo({
    title: 'Услуги — фасадни облицовки и метални конструкции',
    description: 'Фасади от Al Bond / ACP, HPL и керамика, вентилируеми фасади. Метални стълбища и парапети, зимни градини, навеси и козирки, индустриални халета, врати и огради.',
    path: '/uslugi',
    jsonLd: [breadcrumbLd([{ name: 'Начало', path: '/' }, { name: 'Услуги', path: '/uslugi' }])],
  })
  const systems = services.filter((s) => s.group === 'system')
  const metal = services.filter((s) => s.group === 'metal')
  return (
    <>
      <PageHero eyebrow="Услуги" title="Услуги" intro="Фасадни облицовки и метални конструкции — от замерването до монтажа." />
      <section className="container-x" aria-labelledby="sys">
        <h2 id="sys" className="mb-4 text-2xl">Фасади</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((s, i) => <li key={s.slug}><ServiceCard s={s} index={i} /></li>)}
        </ul>
      </section>
      <section id="metalni-konstrukcii" className="container-x mt-14 scroll-mt-28" aria-labelledby="metal">
        <h2 id="metal" className="text-2xl">Метални конструкции</h2>
        <p className="mb-4 mt-2 max-w-2xl text-ink-2">Изработка и монтаж на метални конструкции — от стълбища и огради до зимни градини и индустриални халета.</p>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metal.map((s, i) => <li key={s.slug}><ServiceCard s={s} index={i} /></li>)}
        </ul>
      </section>
      <section className="container-x mt-14" aria-labelledby="stm-link">
        <Link to="/trudova-medicina" className="group flex items-center justify-between gap-4 rounded-[22px] border border-line bg-surface p-6 hover:border-ink-3">
          <span>
            <span className="eyebrow block">Отделна услуга</span>
            <span id="stm-link" className="mt-1 block text-2xl font-semibold">Служба по трудова медицина</span>
            <span className="mt-1 block text-ink-2">Оценка на риска, документация по ЗЗБУТ, здравно наблюдение на служителите.</span>
          </span>
          <Icon name="arrow" className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
      <Process />
      <CtaBand from="services" />
    </>
  )
}
