import { createContext, useContext, useEffect } from 'react'
import { site } from '../content/site'
import type { Project, Service } from '../content/types'
import { materialLabels, buildingTypeSingular } from '../content/labels'

export interface HeadData {
  title: string
  description: string
  /** Route path without base, e.g. "/proekti" */
  path: string
  image?: string
  noindex?: boolean
  jsonLd?: object[]
}

/** During prerendering pages write their head data here; on the client it stays unused. */
export const HeadContext = createContext<{ head?: HeadData } | null>(null)

const BASE = import.meta.env.BASE_URL
export const absoluteUrl = (path: string) => `${site.url}${path === '/' ? '/' : path.replace(/\/$/, '')}`
const ogImage = (img?: string) => `${site.url}/${(img ?? 'og-image.png').replace(/^\//, '')}`

export const fullTitle = (t: string) => (t.includes(site.brand) ? t : `${t} | ${site.brand} ${site.brandTagline}`)

export function useSeo(head: HeadData) {
  const ctx = useContext(HeadContext)
  if (ctx) ctx.head = head
  const key = JSON.stringify(head)
  useEffect(() => {
    applyHead(head)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

export function applyHead(h: HeadData) {
  const title = fullTitle(h.title)
  document.title = title
  setMeta('name', 'description', h.description)
  setMeta('name', 'robots', h.noindex ? 'noindex, nofollow' : 'index, follow')
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', h.description)
  setMeta('property', 'og:url', absoluteUrl(h.path))
  setMeta('property', 'og:image', ogImage(h.image))
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = absoluteUrl(h.path)
  document.head.querySelectorAll('script[data-seo]').forEach((s) => s.remove())
  for (const obj of h.jsonLd ?? []) {
    const s = document.createElement('script')
    s.type = 'application/ld+json'
    s.dataset.seo = ''
    s.textContent = JSON.stringify(obj)
    document.head.appendChild(s)
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const jsonForHtml = (o: object) => JSON.stringify(o).replace(/</g, '\\u003c')

/** Serialised <head> tags for prerendered HTML. */
export function renderHead(h: HeadData): string {
  const title = fullTitle(h.title)
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(h.description)}" />`,
    `<meta name="robots" content="${h.noindex ? 'noindex, nofollow' : 'index, follow'}" />`,
    `<link rel="canonical" href="${esc(absoluteUrl(h.path))}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="bg_BG" />`,
    `<meta property="og:site_name" content="${esc(site.brand)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(h.description)}" />`,
    `<meta property="og:url" content="${esc(absoluteUrl(h.path))}" />`,
    `<meta property="og:image" content="${esc(ogImage(h.image))}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...(h.jsonLd ?? []).map((o) => `<script type="application/ld+json" data-seo>${jsonForHtml(o)}</script>`),
  ].join('\n    ')
}

/* ---------- Structured data (schema.org) — only real fields are emitted ---------- */

const orgId = `${site.url}/#organization`

function contactFields() {
  const c = site.contacts
  return {
    ...(c.phone ? { telephone: c.phone } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(c.address
      ? { address: { '@type': 'PostalAddress', streetAddress: c.address.street, addressLocality: c.address.city, postalCode: c.address.postalCode, addressCountry: 'BG' } }
      : {}),
  }
}

export const organizationLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': orgId,
  name: site.legalName ?? site.brand,
  url: `${site.url}/`,
  logo: `${site.url}/icons/icon-512.png`,
  ...contactFields(),
  sameAs: Object.values(site.social).filter(Boolean),
})

export const localBusinessLd = () => ({
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
  '@id': `${site.url}/#business`,
  name: site.legalName ?? site.brand,
  url: `${site.url}/`,
  image: `${site.url}/og-image.png`,
  parentOrganization: { '@id': orgId },
  ...contactFields(),
  areaServed: site.serviceArea.cities.length ? site.serviceArea.cities.map((c) => ({ '@type': 'City', name: c })) : { '@type': 'Country', name: 'България' },
})

export const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.brand,
  url: `${site.url}/`,
  inLanguage: 'bg',
  publisher: { '@id': orgId },
})

export const serviceLd = (s: Pick<Service, 'name' | 'seoDescription'> & { path: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: s.name,
  description: s.seoDescription,
  url: absoluteUrl(s.path),
  provider: { '@id': orgId },
  areaServed: { '@type': 'Country', name: 'България' },
})

export const projectLd = (p: Project) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: p.title,
  description: p.summary,
  url: absoluteUrl(`/proekti/${p.slug}`),
  creator: { '@id': orgId },
  ...(p.location.city ? { locationCreated: { '@type': 'Place', name: p.location.city } } : {}),
  keywords: [...p.materials.map((m) => materialLabels[m]), buildingTypeSingular[p.type]].join(', '),
  ...(p.year ? { dateCreated: String(p.year) } : {}),
})

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
})

export const routerBase = BASE.replace(/\/$/, '') || '/'
