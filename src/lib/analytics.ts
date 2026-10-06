/**
 * Privacy-friendly analytics. Disabled unless VITE_PLAUSIBLE_DOMAIN is set
 * (Plausible is cookieless and stores no personal data → no consent banner needed).
 * Never pass personal data (names, phones, emails) as event props.
 */
export type AnalyticsEvent =
  | 'cta_click'
  | 'phone_click'
  | 'email_click'
  | 'messenger_click'
  | 'project_view'
  | 'material_view'
  | 'service_view'
  | 'quote_start'
  | 'quote_step'
  | 'quote_complete'
  | 'quick_quote_complete'
  | 'file_upload'
  | 'download_click'

type Props = Record<string, string | number | boolean>
declare global {
  interface Window {
    plausible?: (e: string, o?: { props?: Props }) => void
  }
}

const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined

export function initAnalytics() {
  if (!domain || typeof document === 'undefined') return
  const s = document.createElement('script')
  s.defer = true
  s.dataset.domain = domain
  s.src = 'https://plausible.io/js/script.manual.js'
  document.head.appendChild(s)
  window.plausible = window.plausible || ((...args: unknown[]) => { ((window.plausible as unknown as { q?: unknown[] }).q ||= []).push(args) }) as Window['plausible']
}

export function track(event: AnalyticsEvent, props?: Props) {
  if (typeof window === 'undefined') return
  window.plausible?.(event, props ? { props } : undefined)
  if (import.meta.env.DEV) console.debug('[analytics]', event, props ?? '')
}

export function trackPageview() {
  if (typeof window === 'undefined') return
  window.plausible?.('pageview')
}
