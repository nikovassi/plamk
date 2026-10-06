import { Link } from 'react-router'
import { site } from '../content/site'
import { featuredProjects } from '../content/projects'
import { services } from '../content/services'
import { productCategories } from '../content/products'
import { HeroMedia } from '../components/media/HeroMedia'
import { ButtonLink } from '../components/ui/Button'
import { ProjectCard } from '../components/cards/ProjectCard'
import { ServiceCard } from '../components/cards/ServiceCard'
import { ProductArt } from '../components/media/ProductArt'
import { SectionHead } from '../components/ui/SectionHead'
import { Process } from '../components/sections/Process'
import { CtaBand } from '../components/sections/CtaBand'
import { InlineCta } from '../components/sections/InlineCta'
import { Icon } from '../components/ui/Icon'
import { localBusinessLd, organizationLd, useSeo, websiteLd } from '../lib/seo'

export default function Home() {
  useSeo({
    title: `${site.brand} — фасади, метални конструкции, хартиени продукти и фолиа`,
    description: 'Фасадни облицовки от Al Bond, HPL и керамика, метални конструкции, зимни градини и навеси. Търговия с хартиени продукти и полиетиленови фолиа.',
    path: '/',
    jsonLd: [organizationLd(), localBusinessLd(), websiteLd()],
  })
  const featured = featuredProjects()
  const systems = services.filter((s) => s.group === 'system')

  return (
    <>
      {/* HERO — answers "what, which materials, how to ask" in the first viewport */}
      <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-[#141517] text-white" aria-labelledby="hero-title">
        <HeroMedia image={site.hero.image} video={site.hero.video} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30" aria-hidden="true" />
        <div className="container-x relative pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-28 lg:pb-20">
          <p className="anim-rise text-[0.9375rem] font-semibold tracking-[0.08em] text-white/85" style={{ ['--d' as string]: '80ms' }}>
            Фасади <span className="text-[#4cc2b8]">•</span> Метални конструкции <span className="text-[#4cc2b8]">•</span> Хартия <span className="text-[#4cc2b8]">•</span> Фолиа
          </p>
          <h1 id="hero-title" className="display mt-4 max-w-5xl anim-rise" style={{ ['--d' as string]: '160ms' }}>
            Фасади и търговия
          </h1>
          <p className="mt-5 max-w-xl text-[1.1875rem] leading-snug text-white/85 anim-rise md:text-xl" style={{ ['--d' as string]: '260ms' }}>
            Монтаж на фасадни облицовки и метални конструкции. Хартиени продукти и фолиа на едро и дребно.
          </p>
          <div className="mt-8 flex flex-col gap-3 anim-rise sm:flex-row" style={{ ['--d' as string]: '360ms' }}>
            <ButtonLink to="/zapitvane?ot=hero" size="lg" icon="arrow" cta="hero">
              Поискай оферта
            </ButtonLink>
            <ButtonLink to="/produkti" size="lg" variant="outline-inverse" cta="hero-products">
              Продукти
            </ButtonLink>
          </div>
          <ul className="mt-10 hidden flex-wrap gap-2 anim-rise sm:flex" style={{ ['--d' as string]: '460ms' }} aria-label="Услуги">
            {['Al Bond', 'HPL', 'Керамика', 'Метални конструкции', 'Хартиени продукти', 'Фолиа'].map((t) => (
              <li key={t} className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-white/80 backdrop-blur-sm">{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* PROJECTS — show the work first */}
      <section className="pt-16 md:pt-24" aria-labelledby="projects-title">
        <SectionHead eyebrow="Портфолио" id="projects-title" title="Изпълнени обекти" link={{ to: '/proekti', label: 'Всички проекти' }} />
        <ul className="snap-row rail md:grid-cols-3 md:gap-4">
          {featured.map((p, i) => (
            <li key={p.id} className={`w-[86vw] max-w-sm md:w-auto md:max-w-none ${i === 0 ? 'md:col-span-2 md:row-span-1' : ''}`}>
              <ProjectCard p={p} size={i === 0 ? 'lg' : 'md'} />
            </li>
          ))}
        </ul>
        <InlineCta text="Имате подобен обект? Изпратете снимка — ще ви кажем какво е възможно." to="/zapitvane?ot=projects" from="home-projects" />
      </section>

      {/* SERVICES */}
      <section className="pt-16 md:pt-24" aria-labelledby="services-title">
        <SectionHead eyebrow="Услуги" id="services-title" title="Фасадни системи" intro="Една отговорност — от разкроя до последния панел." link={{ to: '/uslugi', label: 'Всички услуги' }} />
        <ul className="snap-row rail md:grid-cols-3 md:gap-4 lg:grid-cols-3">
          {systems.map((s, i) => (
            <li key={s.slug} className="w-[72vw] max-w-xs md:w-auto md:max-w-none">
              <ServiceCard s={s} index={i} />
            </li>
          ))}
        </ul>
        <InlineCta text="Не сте сигурни коя система е подходяща? Ще ви посъветваме." label="Консултация" to="/zapitvane?ot=services&usluga=consult" from="home-services" />
      </section>

      {/* METAL WORKS */}
      <section className="pt-16 md:pt-24" aria-labelledby="metal-title">
        <SectionHead eyebrow="Също изпълняваме" id="metal-title" title="Метални конструкции" intro="Стълбища и парапети, зимни градини, навеси, индустриални халета, врати и огради." link={{ to: '/uslugi#metalni-konstrukcii', label: 'Всички метални конструкции' }} />
        <ul className="snap-row rail md:grid-cols-3 md:gap-4 lg:grid-cols-5">
          {services.filter((s) => s.group === 'metal').map((s) => (
            <li key={s.slug} className="w-[64vw] max-w-xs md:w-auto md:max-w-none">
              <ServiceCard s={s} tall />
            </li>
          ))}
        </ul>
      </section>

      {/* PRODUCTS */}
      <section className="pt-16 md:pt-24" aria-labelledby="products-title">
        <SectionHead eyebrow="Търговия" id="products-title" title="Продукти" intro="Хартиени продукти и фолиа — за домакинства, офиси, заведения, складове и строителни обекти." link={{ to: '/produkti', label: 'Всички продукти' }} />
        <ul className="container-x grid gap-4 md:grid-cols-2">
          {productCategories.map((c) => (
            <li key={c.slug}>
              <Link to={`/produkti/${c.slug}`} className="group grid h-full overflow-hidden rounded-[24px] border border-line bg-surface transition-shadow hover:shadow-card sm:grid-cols-[1fr_1.1fr]">
                <ProductArt kind={c.art} className="aspect-[16/10] sm:aspect-auto sm:min-h-56" />
                <div className="flex flex-col p-5 md:p-6">
                  <h3 className="text-2xl">{c.name}</h3>
                  <p className="mt-2 text-[0.9375rem] text-ink-2">{c.shortDescription}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-4 font-semibold text-accent">Виж продуктите <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <InlineCta text="Нужно ви е количество на едро? Напишете продукта и количеството." to="/zapitvane?rezhim=barzo&ot=home-products" from="home-products" />
      </section>

      <Process />
      <CtaBand from="home" />
    </>
  )
}
