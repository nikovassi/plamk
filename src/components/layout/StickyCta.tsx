import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { ButtonLink, ButtonA } from '../ui/Button'
import { phoneHref } from '../../content/site'
import { track } from '../../lib/analytics'

const DETAIL = /^\/(proekti|uslugi|produkti)\/[^/]+/

/**
 * Sticky "Поискай оферта" on detail pages after the visitor scrolls past the hero.
 * Sits above the bottom navigation on phones; floats bottom-right on desktop.
 * Hides while an inline CTA block or the footer is visible.
 */
export function StickyCta() {
  const { pathname } = useLocation()
  const active = DETAIL.test(pathname)
  const [scrolled, setScrolled] = useState(false)
  const [inlineCtaVisible, setInlineCtaVisible] = useState(false)
  useEffect(() => {
    if (!active) return
    const on = () => setScrolled(window.scrollY > 480)
    on()
    window.addEventListener('scroll', on, { passive: true })
    // Hide while an inline quote block or the footer is on screen — never two CTAs at once
    const visible = new Set<Element>()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target)
        else visible.delete(e.target)
      }
      setInlineCtaVisible(visible.size > 0)
    })
    const t = setTimeout(() => document.querySelectorAll('[data-inline-cta], footer').forEach((el) => io.observe(el)), 0)
    return () => {
      window.removeEventListener('scroll', on)
      clearTimeout(t)
      io.disconnect()
    }
  }, [active, pathname])
  const show = scrolled && !inlineCtaVisible
  if (!active) return null
  const tel = phoneHref()
  const [, from, slug] = pathname.split('/')
  const to = from === 'produkti' ? `/zapitvane?rezhim=barzo&interes=${slug === 'folia' ? 'film' : 'paper'}&ot=sticky-produkti` : `/zapitvane?ot=${from}`
  return (
    <div
      aria-hidden={!show}
      data-testid="sticky-cta"
      className={`fixed inset-x-0 z-40 px-3 transition-[transform,opacity] duration-300 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:bottom-6 lg:left-auto lg:right-6 lg:px-0 ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <div className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-line bg-surface/95 p-1.5 shadow-float backdrop-blur-xl lg:mx-0">
        <ButtonLink to={to} className="flex-1" tabIndex={show ? 0 : -1} cta={`sticky-${from}`} icon="arrow">
          Поискай оферта
        </ButtonLink>
        {tel && (
          <ButtonA href={tel} variant="ghost" aria-label="Обади се" className="w-12 !px-0" iconLeft="phone" tabIndex={show ? 0 : -1} onClick={() => track('phone_click', { from: 'sticky' })}>
            <span className="sr-only">Обади се</span>
          </ButtonA>
        )}
      </div>
    </div>
  )
}
