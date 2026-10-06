import { PageHero } from '../components/sections/PageHero'
import { ButtonLink } from '../components/ui/Button'
import { useSeo } from '../lib/seo'

export default function NotFound() {
  useSeo({ title: 'Страницата не е намерена', description: 'Страницата не съществува или е преместена.', path: '/404', noindex: true })
  return (
    <div className="min-h-[70svh]">
      <PageHero eyebrow="Грешка 404" title="Тази страница не съществува" intro="Може адресът да е променен. Продължете към проектите или изпратете запитване.">
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/" size="lg" variant="secondary">Към началната страница</ButtonLink>
          <ButtonLink to="/proekti" size="lg" variant="ghost">Виж проектите</ButtonLink>
          <ButtonLink to="/zapitvane" size="lg" icon="arrow">Поискай оферта</ButtonLink>
        </div>
      </PageHero>
    </div>
  )
}
