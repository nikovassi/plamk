import { ButtonLink, ButtonA } from '../ui/Button'
import { phoneHref, site } from '../../content/site'
import { track } from '../../lib/analytics'
import { Media } from '../media/Media'

/** Reusable conversion block placed after services, materials, projects, case studies and before the footer. */
export function CtaBand({ title = 'Имате проект за фасада?', text, from, compact, to }: { title?: string; text?: string; from: string; compact?: boolean; /** quote URL (default: facade wizard) */ to?: string }) {
  const tel = phoneHref()
  return (
    <section className={`container-x ${compact ? 'my-12' : 'my-16 md:my-24'}`} aria-label="Запитване за оферта" data-inline-cta>
      <div className="relative isolate overflow-hidden rounded-[28px] bg-[#141517] px-6 py-10 text-white ring-1 ring-white/10 md:px-14 md:py-16">
        <Media image={{ alt: '', tone: 'acp-graphite', seed: 77 }} label={false} className="absolute inset-0 -z-10 h-full w-full opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#141517] via-[#141517]/85 to-[#141517]/30" />
        <div className="max-w-2xl reveal">
          <h2 className="text-[clamp(1.9rem,5vw,3.2rem)]">{title}</h2>
          <p className="mt-4 text-lg text-white/75">
            {text ?? 'Изпратете снимки, чертеж или кратко описание. Ще прегледаме информацията и ще се свържем с вас за оглед и оферта.'}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={to ?? `/zapitvane?ot=${from}`} size="lg" icon="arrow" cta={`band-${from}`}>
              Поискай оферта
            </ButtonLink>
            {tel ? (
              <ButtonA href={tel} size="lg" variant="outline-inverse" iconLeft="phone" onClick={() => track('phone_click', { from: `band-${from}` })}>
                Обади се {site.contacts.phoneDisplay ? `· ${site.contacts.phoneDisplay}` : ''}
              </ButtonA>
            ) : (
              <ButtonLink to="/proekti" size="lg" variant="outline-inverse">
                Виж проектите
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
