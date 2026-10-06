import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { ButtonLink, ButtonA } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { phoneHref, site } from '../../content/site'
import { track } from '../../lib/analytics'

export const mainNav = [
  { to: '/uslugi', label: 'Услуги' },
  { to: '/produkti', label: 'Продукти' },
  { to: '/proekti', label: 'Проекти' },
  { to: '/kontakti', label: 'Контакти' },
]

/** Quote target matching the section the visitor is in */
export function quoteHref(pathname: string) {
  if (pathname.startsWith('/trudova-medicina')) return '/zapitvane?rezhim=barzo&interes=stm&ot=header'
  if (pathname.startsWith('/produkti/folia')) return '/zapitvane?rezhim=barzo&interes=film&ot=header'
  if (pathname.startsWith('/produkti')) return '/zapitvane?rezhim=barzo&interes=paper&ot=header'
  return '/zapitvane'
}

export function Header() {
  const { pathname } = useLocation()
  const overlayRoute = pathname === '/' || /^\/proekti\/.+/.test(pathname)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [pathname])
  const overlay = overlayRoute && !scrolled
  const tel = phoneHref()
  const inQuote = pathname.startsWith('/zapitvane')

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background,color,box-shadow] duration-300 ${
        overlay ? 'bg-transparent text-white' : 'bg-bg/85 text-ink shadow-[0_1px_0_var(--line)] backdrop-blur-xl backdrop-saturate-150'
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link to="/" className="-ml-1 rounded-lg p-1">
          <Logo />
        </Link>
        <nav aria-label="Основна навигация" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  className={({ isActive }) =>
                    `relative inline-flex h-11 items-center whitespace-nowrap rounded-full px-3 text-[0.9375rem] xl:px-4 font-medium transition-colors ${isActive ? 'bg-current/10' : 'hover:bg-current/5'}`
                  }
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
            <li className="ml-2">
              <NavLink
                to="/trudova-medicina"
                className={({ isActive }) =>
                  `inline-flex h-10 items-center whitespace-nowrap rounded-full bg-stm px-4 text-[0.9375rem] font-semibold text-stm-ink shadow-[0_8px_24px_-12px_var(--stm)] transition-colors hover:bg-stm-hover ${isActive ? 'ring-2 ring-stm/40 ring-offset-2 ring-offset-transparent' : ''}`
                }
              >
                Трудова медицина
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {tel && (
            <a href={tel} onClick={() => track('phone_click', { from: 'header' })} className="grid h-11 w-11 place-items-center rounded-full hover:bg-current/10 xl:hidden" aria-label={`Обади се: ${site.contacts.phoneDisplay ?? site.contacts.phone}`}>
              <Icon name="phone" />
            </a>
          )}
          {tel && (
            <span className="hidden xl:block">
              <ButtonA href={tel} variant={overlay ? 'outline-inverse' : 'ghost'} size="sm" iconLeft="phone" onClick={() => track('phone_click', { from: 'header' })}>
                Обади се
              </ButtonA>
            </span>
          )}
          {!inQuote && (
            <span className="ml-1 hidden lg:block">
              <ButtonLink to={quoteHref(pathname)} size="sm" cta="header">
                Поискай оферта
              </ButtonLink>
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
