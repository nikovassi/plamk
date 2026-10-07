import type { Certificate, ImageAsset, TrustFact, VideoAsset } from './types'

/**
 * Company data. Every `null` value is rendered as a visible placeholder or hidden
 * (contact channels are shown ONLY when provided — e.g. WhatsApp / Viber).
 * Replace with real, verified data before launch.
 */
export const site = {
  /** Source: Търговски регистър (ЕИК 206743735) */
  brand: 'ПЛАМК',
  /** Key stored with every lead (one Supabase project serves both sites) */
  leadSite: 'plamk' as 'recom' | 'plamk',
  brandTagline: 'фасади · хартия · фолиа',
  legalName: 'ПЛАМК ЕООД' as string | null,
  /** ЕИК */
  vatId: '206743735' as string | null,
  /** Registered 02.12.2021 */
  foundedYear: 2021 as number | null,

  url: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || 'https://nikovassi.github.io/plamk',

  contacts: {
    /** E.164 format, e.g. "+359888123456" */
    phone: '+359895675875' as string | null,
    phoneDisplay: '0895 675 875' as string | null,
    /** Shown on the contact page next to the phone */
    person: { name: 'Пламен Кръстираев', role: 'Управител' } as { name: string; role: string } | null,
    email: 'office@plamk.net' as string | null,
    privacyEmail: 'office@plamk.net' as string | null,
    /** Number in international format without "+" for wa.me links */
    whatsapp: null as string | null,
    viber: null as string | null,
    address: { street: 'ул. „Георги Раковски“ 3', city: 'Казанлък', postalCode: '6100' } as { street: string; city: string; postalCode?: string } | null,
    workingHours: null as string | null,
  },

  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    linkedin: null as string | null,
    youtube: null as string | null,
  },

  /** Hero visual. Replace with a real facade photo (and optional short video with poster). */
  hero: {
    image: { src: 'images/projects/hpl-darvesen-dekor/cover', alt: 'Жилищна сграда с HPL фасада в дървесен декор' } as ImageAsset,
    video: null as VideoAsset | null,
  },

  /** Promise shown in the quote flow. null → placeholder until the company confirms it. */
  responseTime: null as string | null,

  serviceArea: {
    summary: null as string | null,
    cities: [] as string[],
    international: [] as string[],
  },

  /**
   * Local SEO landing pages. Add a region ONLY when the company has real projects and
   * unique content there — each entry generates /fasadi-<slug>.
   */
  regions: [] as { slug: string; city: string; intro: string }[],

  /** Facts for the trust section. value: null → placeholder (never invent numbers). */
  trustFacts: [] as TrustFact[],

  /** Logos of clients / partners / manufacturers — only with written permission. */
  partners: [] as { name: string; logo: string; href?: string }[],
}

/** Add real certificates (ISO, IPAF, manufacturer trainings) here — the section appears automatically. */
export const certificates: Certificate[] = []

export const hasPhone = () => Boolean(site.contacts.phone)
export const phoneHref = () => (site.contacts.phone ? `tel:${site.contacts.phone}` : undefined)
export const emailHref = () => (site.contacts.email ? `mailto:${site.contacts.email}` : undefined)
