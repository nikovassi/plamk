import { emailHref, phoneHref, site } from '../../content/site'
import { track } from '../../lib/analytics'
import { Icon, type IconName } from '../ui/Icon'

interface Action { key: string; href: string; label: string; sub: string; icon: IconName; event: 'phone_click' | 'email_click' | 'messenger_click' }

/** Contact channels — each one is rendered ONLY if the company has provided it. */
export function contactActions(): Action[] {
  const c = site.contacts
  const out: Action[] = []
  const tel = phoneHref()
  if (tel) out.push({ key: 'call', href: tel, label: 'Обади се', sub: c.phoneDisplay ?? c.phone ?? '', icon: 'phone', event: 'phone_click' })
  if (c.whatsapp) out.push({ key: 'whatsapp', href: `https://wa.me/${c.whatsapp}`, label: 'WhatsApp', sub: 'Съобщение', icon: 'message', event: 'messenger_click' })
  if (c.viber) out.push({ key: 'viber', href: `viber://chat?number=%2B${c.viber.replace(/^\+/, '')}`, label: 'Viber', sub: 'Съобщение', icon: 'message', event: 'messenger_click' })
  const mail = emailHref()
  if (mail) out.push({ key: 'email', href: mail, label: 'Email', sub: c.email ?? '', icon: 'mail', event: 'email_click' })
  return out
}

export function ContactActions({ from, inverse }: { from: string; inverse?: boolean }) {
  const actions = contactActions()
  if (!actions.length) return null
  return (
    <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {actions.map((a) => (
        <li key={a.key}>
          <a
            href={a.href}
            onClick={() => track(a.event, { from, channel: a.key })}
            className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${inverse ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-surface-2 hover:bg-surface-3'}`}
            {...(a.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <Icon name={a.icon} className="h-5 w-5 shrink-0" />
            <span className="flex flex-col leading-tight">
              <span className="font-semibold">{a.label}</span>
              {a.sub && <span className="text-sm opacity-70">{a.sub}</span>}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
