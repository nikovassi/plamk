import { useEffect, useRef } from 'react'
import { ButtonLink, ButtonA } from '../../components/ui/Button'
import { phoneHref, site } from '../../content/site'
import { track } from '../../lib/analytics'

export function Success({ reference, email }: { reference: string; email?: string }) {
  const h = useRef<HTMLHeadingElement>(null)
  useEffect(() => { h.current?.focus(); window.scrollTo({ top: 0 }) }, [])
  const tel = phoneHref()
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-lg flex-col justify-center px-4 py-24 text-center" data-testid="success">
      <svg viewBox="0 0 64 64" className="mx-auto h-20 w-20 text-accent" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.12" />
        <path d="M20 33l8 8 16-17" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="48" style={{ animation: 'check 0.6s 0.2s var(--ease-out-expo) both' }} />
      </svg>
      <h1 ref={h} tabIndex={-1} className="mt-6 text-[clamp(2rem,7vw,2.75rem)] outline-none">Запитването е изпратено.</h1>
      <p className="mt-3 text-xl">Благодарим ви.</p>
      <p className="mt-3 text-ink-2">Нашият екип ще се свържет с вас след преглед на информацията{site.responseTime ? ` — ${site.responseTime}` : ''}.</p>
      <div className="mx-auto mt-8 w-full rounded-[22px] border border-line bg-surface p-5">
        <p className="text-sm text-ink-3">Номер на запитването</p>
        <p className="tnum mt-1 text-3xl font-semibold tracking-wide" data-testid="reference">{reference}</p>
        {email && <p className="mt-2 text-sm text-ink-3">Потвърждение е изпратено на {email}.</p>}
      </div>
      <div className="mt-8 grid gap-3">
        {tel ? (
          <ButtonA href={tel} size="lg" iconLeft="phone" onClick={() => track('phone_click', { from: 'success' })}>Обади се</ButtonA>
        ) : null}
        <ButtonLink to="/" size="lg" variant="ghost">Към началната страница</ButtonLink>
      </div>
    </div>
  )
}
