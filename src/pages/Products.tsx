import { Link } from 'react-router'
import { productCategories } from '../content/products'
import { ProductArt } from '../components/media/ProductArt'
import { PageHero } from '../components/sections/PageHero'
import { CtaBand } from '../components/sections/CtaBand'
import { Icon } from '../components/ui/Icon'
import { breadcrumbLd, useSeo } from '../lib/seo'

export default function Products() {
  useSeo({
    title: 'Продукти — хартиени продукти и фолиа',
    description: 'Тоалетна хартия, кърпи за ръце, салфетки, стреч фолио, полиетиленово, строително, термосвиваемо и въздушно-мехурчесто фолио.',
    path: '/produkti',
    jsonLd: [breadcrumbLd([{ name: 'Начало', path: '/' }, { name: 'Продукти', path: '/produkti' }])],
  })
  return (
    <>
      <PageHero eyebrow="Търговия" title="Продукти" intro="Хартиени продукти и фолиа за домакинства, офиси, заведения, складове и строителни обекти. Изпратете запитване с количество — ще потвърдим наличност и цена." />
      <section className="container-x grid gap-4 md:grid-cols-2" aria-label="Категории">
        {productCategories.map((c) => (
          <Link key={c.slug} to={`/produkti/${c.slug}`} className="group overflow-hidden rounded-[28px] border border-line bg-surface transition-shadow hover:shadow-card">
            <ProductArt kind={c.art} className="aspect-[4/3] md:aspect-[16/9]" />
            <div className="p-6 md:p-8">
              <p className="eyebrow">{c.eyebrow}</p>
              <h2 className="mt-2 text-3xl">{c.name}</h2>
              <p className="mt-3 text-ink-2">{c.shortDescription}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {c.items.map((i) => <li key={i.id} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm">{i.name}</li>)}
              </ul>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold text-accent">
                Виж продуктите <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </section>
      <CtaBand from="products" to="/zapitvane?rezhim=barzo&ot=products" title="Търсите конкретен продукт или количество?" text="Напишете какво ви трябва и в какво количество — ще ви се обадим с наличност и цена." />
    </>
  )
}
