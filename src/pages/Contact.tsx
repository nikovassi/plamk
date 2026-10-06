import { Link } from 'react-router'
import { site } from '../content/site'
import { PageHero } from '../components/sections/PageHero'
import { ContactActions } from '../components/sections/ContactActions'
import { ServiceArea } from '../components/sections/ServiceArea'
import { ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { breadcrumbLd, localBusinessLd, useSeo } from '../lib/seo'

export default function Contact() {
  useSeo({
    title: 'Контакти — запитване за фасада',
    description: 'Свържете се с нас за оферта за фасадна облицовка: телефон, email или онлайн запитване със снимки и чертежи.',
    path: '/kontakti',
    jsonLd: [localBusinessLd(), breadcrumbLd([{ name: 'Начало', path: '/' }, { name: 'Контакти', path: '/kontakti' }])],
  })
  const c = site.contacts
  return (
    <>
      <PageHero eyebrow="Контакти" title="Свържете се с нас" intro="Обадете се или изпратете запитване — за фасади, метални конструкции, трудова медицина или продукти." />
      <section className="container-x grid gap-4 md:grid-cols-2">
        <Link to="/zapitvane?ot=kontakti" className="group flex flex-col justify-between gap-10 rounded-[28px] bg-accent p-6 text-accent-ink md:p-8">
          <Icon name="send" className="h-8 w-8" />
          <span>
            <span className="block text-3xl font-semibold">Пълно запитване</span>
            <span className="mt-2 block opacity-85">7 кратки стъпки · файлове и снимки · около 1 минута</span>
          </span>
          <span className="inline-flex items-center gap-2 font-semibold">Започни <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" /></span>
        </Link>
        <Link to="/zapitvane?rezhim=barzo&ot=kontakti" className="group flex flex-col justify-between gap-10 rounded-[28px] border border-line bg-surface p-6 md:p-8">
          <Icon name="bolt" className="h-8 w-8 text-accent" />
          <span>
            <span className="block text-3xl font-semibold">Бързо запитване</span>
            <span className="mt-2 block text-ink-2">Име, телефон, град и снимка — ще ви се обадим</span>
          </span>
          <span className="inline-flex items-center gap-2 font-semibold">Изпрати <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" /></span>
        </Link>
      </section>
      <section className="container-x mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl">Директен контакт</h2>
          {c.person && (
            <p className="mb-4 text-lg">
              <span className="font-semibold">{c.person.name}</span> <span className="text-ink-2">· {c.person.role}</span>
            </p>
          )}
          <ContactActions from="contact" />
        </div>
        <div>
          <h2 className="mb-4 text-2xl">Офис</h2>
          <address className="not-italic text-lg text-ink-2">
            {c.address ? <p>{[c.address.postalCode, `гр. ${c.address.city}`].filter(Boolean).join(' ')}<br />{c.address.street}</p> : null}
            {c.workingHours && <p className="mt-3">Работно време: {c.workingHours}</p>}
          </address>
          {c.address && (
            <a className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-accent" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.address.street}, ${c.address.city}`)}`} target="_blank" rel="noopener noreferrer">
              <Icon name="pin" /> Отвори в карти
            </a>
          )}
        </div>
      </section>
      <ServiceArea />
      <div className="container-x mb-16"><ButtonLink to="/proekti" variant="ghost" icon="arrow">Виж проектите</ButtonLink></div>
    </>
  )
}
