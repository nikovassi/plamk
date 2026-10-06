import { Link, useParams } from 'react-router'
import { getProductCategory, productCategories } from '../content/products'
import { ProductArt } from '../components/media/ProductArt'
import { Breadcrumbs } from '../components/sections/PageHero'
import { CtaBand } from '../components/sections/CtaBand'
import { ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { breadcrumbLd, serviceLd, useSeo } from '../lib/seo'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const c = getProductCategory(slug)
  if (!c) return <NotFound />
  return <ProductView key={c.slug} c={c} />
}

function ProductView({ c }: { c: NonNullable<ReturnType<typeof getProductCategory>> }) {
  const path = `/produkti/${c.slug}`
  useSeo({
    title: c.seoTitle,
    description: c.seoDescription,
    path,
    jsonLd: [serviceLd({ name: c.name, seoDescription: c.seoDescription, path }), breadcrumbLd([{ name: 'Начало', path: '/' }, { name: 'Продукти', path: '/produkti' }, { name: c.name, path }])],
  })
  const quote = (item?: string) => `/zapitvane?rezhim=barzo&interes=${c.interest}&ot=produkt-${c.slug}${item ? `&produkt=${encodeURIComponent(item)}` : ''}`
  const other = productCategories.find((x) => x.slug !== c.slug)

  return (
    <article>
      <header className="container-x pt-[calc(5.5rem+env(safe-area-inset-top))] lg:pt-28">
        <Breadcrumbs items={[{ name: 'Начало', to: '/' }, { name: 'Продукти', to: '/produkti' }, { name: c.name, to: path }]} />
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-end">
          <div>
            <p className="eyebrow anim-rise">{c.eyebrow}</p>
            <h1 className="mt-2 text-[clamp(2.8rem,10vw,6rem)] font-semibold leading-[0.92] tracking-[-0.045em] anim-rise">{c.name}</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-2 anim-rise md:text-xl" style={{ ['--d' as string]: '100ms' }}>{c.description}</p>
            <div className="mt-7 flex flex-col gap-3 anim-rise sm:flex-row" style={{ ['--d' as string]: '160ms' }}>
              <ButtonLink to={quote()} size="lg" icon="arrow" cta={`product-${c.slug}`}>Изпрати запитване</ButtonLink>
            </div>
          </div>
          <ProductArt kind={c.art} className="aspect-[4/3] rounded-[28px]" label={c.name} />
        </div>
      </header>

      <section className="container-x py-14 md:py-20" aria-labelledby="items">
        <h2 id="items" className="h-section mb-8">Асортимент</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.items.map((i) => (
            <li key={i.id} className="flex flex-col overflow-hidden rounded-[24px] border border-line bg-surface">
              <ProductArt kind={i.art} className="aspect-[16/10]" />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-2xl">{i.name}</h3>
                <p className="mt-2 text-ink-2">{i.description}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {i.uses.map((u) => <li key={u} className="rounded-full bg-surface-2 px-3 py-1 text-sm">{u}</li>)}
                </ul>
                <Link to={quote(i.name)} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 font-semibold text-accent">
                  Запитване за {i.name.toLowerCase()} <Icon name="arrow" className="h-5 w-5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-10 rounded-[22px] bg-surface-2 p-6">
          <h3 className="eyebrow mb-3">Подходящо за</h3>
          <ul className="flex flex-wrap gap-2">{c.forWhom.map((f) => <li key={f} className="rounded-full bg-surface px-4 py-2">{f}</li>)}</ul>
          <p className="mt-4 text-ink-2">Размери, разфасовки и цени уточняваме според количеството и текущата наличност.</p>
        </div>
      </section>

      <CtaBand from={`product-${c.slug}`} to={quote()} title={`Поръчка на ${c.name.toLowerCase()}?`} text="Напишете продукта и количеството — ще потвърдим наличност, цена и доставка." />

      {other && (
        <nav className="container-x pb-8" aria-label="Други продукти">
          <Link to={`/produkti/${other.slug}`} className="group flex items-center justify-between gap-4 rounded-[22px] border border-line bg-surface p-5 hover:border-ink-3">
            <span><span className="eyebrow block">Вижте още</span><span className="mt-1 block text-2xl font-semibold">{other.name}</span></span>
            <Icon name="arrow" className="h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </nav>
      )}
    </article>
  )
}
