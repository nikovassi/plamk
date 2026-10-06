import { occupationalHealth as oh } from '../content/occupationalHealth'
import { PageHero } from '../components/sections/PageHero'
import { CtaBand } from '../components/sections/CtaBand'
import { ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { breadcrumbLd, serviceLd, useSeo } from '../lib/seo'

const quote = (from: string) => `/zapitvane?rezhim=barzo&interes=stm&ot=${from}`

export default function OccupationalHealth() {
  useSeo({
    title: 'Служба по трудова медицина — СТМ за фирми',
    description: 'Обслужване от служба по трудова медицина: оценка на риска, задължителна документация по ЗЗБУТ, наблюдение на здравето на служителите, консултации и одит.',
    path: oh.path,
    jsonLd: [
      serviceLd({ name: oh.name, seoDescription: oh.intro, path: oh.path }),
      breadcrumbLd([{ name: 'Начало', path: '/' }, { name: oh.name, path: oh.path }]),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: oh.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  })
  return (
    <>
      <PageHero eyebrow="СТМ за фирми" title={oh.name} intro={oh.intro} crumbs={[{ name: 'Начало', to: '/' }, { name: oh.short, to: oh.path }]}>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <ButtonLink to={quote('stm-hero')} size="lg" icon="arrow" cta="stm-hero">Поискай оферта</ButtonLink>
          <ButtonLink to={`${quote('stm-audit')}&produkt=${encodeURIComponent('Безплатен одит на документацията')}`} size="lg" variant="ghost" cta="stm-audit">Безплатен одит</ButtonLink>
        </div>
        {oh.registration && <p className="mt-5 text-sm text-ink-3">{oh.registration}</p>}
      </PageHero>

      <section className="container-x" aria-labelledby="oblig">
        <div className="grid gap-4 rounded-[28px] border border-line bg-surface p-6 md:grid-cols-[auto_1fr] md:items-start md:gap-6 md:p-10">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon name="shield" className="h-7 w-7" /></span>
          <div>
            <h2 id="oblig" className="text-2xl md:text-3xl">Задължение за всеки работодател</h2>
            <p className="mt-3 text-lg text-ink-2">{oh.obligation}</p>
          </div>
        </div>
      </section>

      <section className="container-x mt-14 md:mt-20" aria-labelledby="oh-services">
        <h2 id="oh-services" className="h-section mb-6">Какво предлагаме</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {oh.services.map((s, i) => (
            <li key={s.id} className="reveal flex flex-col rounded-[22px] border border-line bg-surface p-5 md:p-6" style={{ ['--d' as string]: `${i * 60}ms` }}>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-accent"><Icon name={s.icon} /></span>
              <h3 className="mt-5 text-xl">{s.title}</h3>
              <p className="mt-2 text-[0.9375rem] text-ink-2">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-14 grid gap-8 md:mt-20 md:grid-cols-2" aria-labelledby="included">
        <div>
          <p className="eyebrow mb-3">Абонаментно обслужване</p>
          <h2 id="included" className="h-section">Какво включва</h2>
          <p className="mt-4 text-lg text-ink-2">Дейностите, които службата по трудова медицина извършва за вашата фирма през годината.</p>
        </div>
        <ul className="grid gap-2">
          {oh.included.map((t) => (
            <li key={t} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4">
              <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-14 md:mt-20" aria-labelledby="oh-steps">
        <h2 id="oh-steps" className="h-section mb-6">Как започваме</h2>
        <ol className="grid gap-3 md:grid-cols-5">
          {oh.steps.map((s, i) => (
            <li key={s.t} className="reveal rounded-[22px] border border-line bg-surface p-5" style={{ ['--d' as string]: `${i * 70}ms` }}>
              <span className="tnum text-sm font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-4 text-lg">{s.t}</h3>
              <p className="mt-1 text-[0.9375rem] text-ink-2">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-x mt-14 md:mt-20" aria-labelledby="faq">
        <h2 id="faq" className="h-section mb-6">Въпроси и отговори</h2>
        <div className="grid gap-2">
          {oh.faq.map((f) => (
            <details key={f.q} className="group rounded-[20px] border border-line bg-surface p-5 open:shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {f.q}
                <Icon name="chevronDown" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <CtaBand from="stm" to={quote('stm-band')} title="Нужна ви е служба по трудова медицина?" text="Напишете броя на служителите и дейността на фирмата — ще ви изпратим оферта." />
    </>
  )
}
