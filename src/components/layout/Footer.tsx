import { Link } from 'react-router'
import { Logo } from './Logo'
import { site } from '../../content/site'
import { services } from '../../content/services'
import { productCategories } from '../../content/products'
import { ContactActions } from '../sections/ContactActions'

export function Footer() {
  const c = site.contacts
  const socials = Object.entries(site.social).filter(([, v]) => v) as [string, string][]
  const linkCls = 'inline-flex min-h-10 items-center text-ink-2 hover:text-ink'
  return (
    <footer className="mt-8 border-t border-line bg-surface pb-32 pt-14 lg:pb-12">
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-sm text-ink-2">Фасадни облицовки и метални конструкции. Служба по трудова медицина. Търговия с хартиени продукти и фолиа.</p>
          <div className="mt-6">
            <ContactActions from="footer" />
          </div>
        </div>
        <nav aria-label="Услуги">
          <h2 className="eyebrow mb-3">Услуги</h2>
          <ul>
            {services.filter((s) => s.group === 'system').map((s) => (
              <li key={s.slug}><Link className={linkCls} to={`/uslugi/${s.slug}`}>{s.name}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Продукти и проекти">
          <h2 className="eyebrow mb-3">Продукти</h2>
          <ul>
            {productCategories.map((c) => (
              <li key={c.slug}><Link className={linkCls} to={`/produkti/${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
          <h2 className="eyebrow mb-3 mt-6">Метални конструкции</h2>
          <ul>
            {services.filter((s) => s.group === 'metal').map((s) => (
              <li key={s.slug}><Link className={linkCls} to={`/uslugi/${s.slug}`}>{s.name}</Link></li>
            ))}
          </ul>
          <h2 className="eyebrow mb-3 mt-6">Още</h2>
          <ul>
            <li><Link className={linkCls} to="/trudova-medicina">Служба по трудова медицина</Link></li>
            <li><Link className={linkCls} to="/proekti">Проекти</Link></li>
            <li><Link className={linkCls} to="/kontakti">Контакти</Link></li>
          </ul>
        </nav>
        <div className="col-span-2 lg:col-span-1">
          <h2 className="eyebrow mb-3">Контакти</h2>
          <address className="not-italic text-ink-2">
            {c.address ? (
              <p>гр. {c.address.city}, {c.address.street}</p>
            ) : null}
            {c.workingHours && <p className="mt-2">{c.workingHours}</p>}
          </address>
          {site.legalName && <p className="mt-4 text-sm text-ink-3">{site.legalName}{site.vatId ? ` · ЕИК ${site.vatId}` : ''}</p>}
          {socials.length > 0 && (
            <ul className="mt-4 flex gap-3">
              {socials.map(([k, v]) => (
                <li key={k}><a className={linkCls} href={v} target="_blank" rel="noopener noreferrer">{k[0].toUpperCase() + k.slice(1)}</a></li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="container-x mt-12 flex flex-col gap-3 border-t border-line pt-6 text-sm text-ink-3 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} {site.legalName ?? site.brand}</p>
        <ul className="flex flex-wrap gap-x-5">
          <li><Link className={linkCls} to="/poveritelnost">Поверителност</Link></li>
          <li><Link className={linkCls} to="/usloviya">Условия</Link></li>
          <li><Link className={linkCls} to="/biskvitki">Бисквитки</Link></li>
        </ul>
      </div>
    </footer>
  )
}
