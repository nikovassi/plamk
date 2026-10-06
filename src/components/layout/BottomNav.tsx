import { NavLink, useLocation } from 'react-router'
import { Icon, type IconName } from '../ui/Icon'
import { track } from '../../lib/analytics'
import { quoteHref } from './Header'

const items: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Начало', icon: 'home', end: true },
  { to: '/uslugi', label: 'Услуги', icon: 'layers' },
  { to: '/produkti', label: 'Продукти', icon: 'grid' },
  { to: '/kontakti', label: 'Контакти', icon: 'phone' },
]

/** App-style bottom navigation (phones & tablets). Hidden while the quote form is open. */
export function BottomNav() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/zapitvane') || pathname.startsWith('/admin')) return null
  return (
    <nav aria-label="Мобилна навигация" className="fixed inset-x-0 bottom-0 z-50 lg:hidden" data-testid="bottom-nav">
      <div className="mx-2 mb-[max(0.5rem,env(safe-area-inset-bottom))] rounded-[22px] border border-line bg-surface/90 shadow-float backdrop-blur-xl backdrop-saturate-150">
        <ul className="grid grid-cols-5 items-center px-1 py-1">
          {items.map((it) => (
            <li key={it.to}>
              <NavLink
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[0.75rem] font-medium transition-colors ${isActive ? 'text-ink' : 'text-ink-3'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={it.icon} className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.1 : 1.6} />
                    <span>{it.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink
              to={quoteHref(pathname)}
              onClick={() => track('cta_click', { cta: 'bottom-nav' })}
              className="mx-auto flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-2xl bg-accent text-[0.75rem] font-semibold text-accent-ink shadow-[0_8px_20px_-8px_var(--accent)] active:scale-95 transition-transform"
            >
              <Icon name="send" className="h-[22px] w-[22px]" strokeWidth={2} />
              <span>Запитване</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  )
}
