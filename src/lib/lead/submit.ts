import type { Attachment } from './files'
import type { LeadInput, QuickLeadInput } from './schema'
import { site } from '../../content/site'

/**
 * Sends a lead to the configured API endpoint (Supabase Edge Function `submit-lead`).
 * No secrets live here: the anon key is public by design and only allows calling the function.
 * If no endpoint is configured, submission FAILS loudly — we never simulate a backend.
 */
export const LEAD_ENDPOINT = (import.meta.env.VITE_LEAD_ENDPOINT as string | undefined) || ''
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || ''

export const isLeadEndpointConfigured = () => LEAD_ENDPOINT.length > 0

export type SubmitErrorCode = 'not-configured' | 'offline' | 'network' | 'timeout' | 'rejected' | 'server'

export class SubmitError extends Error {
  constructor(
    public code: SubmitErrorCode,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

export interface SubmitResult {
  reference: string
}

export type LeadPayload =
  | ({ kind: 'full' } & Omit<LeadInput, 'consent'>)
  | ({ kind: 'quick' } & Omit<QuickLeadInput, 'consent'>)

export interface SubmitOptions {
  /** 0..1 upload progress */
  onProgress?: (p: number) => void
  /** Spam protection: hidden field must stay empty; time since the form was opened */
  honeypot?: string
  startedAt?: number
  /** Page the visitor came from — helps the sales team, contains no personal data */
  source?: string
  endpoint?: string
  timeoutMs?: number
}

export function buildFormData(payload: LeadPayload, files: Attachment[], o: SubmitOptions = {}) {
  const fd = new FormData()
  fd.append('payload', JSON.stringify({ ...payload, consent: true, site: site.leadSite, source: o.source ?? '' }))
  fd.append('website', o.honeypot ?? '')
  fd.append('elapsedMs', String(o.startedAt ? Date.now() - o.startedAt : 0))
  for (const a of files) fd.append('files', a.file, a.file.name)
  return fd
}

export function submitLead(payload: LeadPayload, files: Attachment[], o: SubmitOptions = {}): Promise<SubmitResult> {
  const endpoint = o.endpoint ?? LEAD_ENDPOINT
  if (!endpoint)
    return Promise.reject(new SubmitError('not-configured', 'Онлайн изпращането все още не е активирано. Моля, свържете се с нас по телефон или email.'))
  if (typeof navigator !== 'undefined' && navigator.onLine === false)
    return Promise.reject(new SubmitError('offline', 'Няма интернет връзка. Запитването е запазено на устройството и ще може да го изпратите веднага щом връзката се възстанови.'))

  const body = buildFormData(payload, files, o)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint)
    xhr.timeout = o.timeoutMs ?? 120_000
    if (ANON_KEY) {
      xhr.setRequestHeader('apikey', ANON_KEY)
      // Legacy anon keys are JWTs; new publishable keys (sb_publishable_…) must not be sent as a Bearer token
      if (!ANON_KEY.startsWith('sb_')) xhr.setRequestHeader('Authorization', `Bearer ${ANON_KEY}`)
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) o.onProgress?.(e.loaded / e.total)
    }
    xhr.onload = () => {
      let data: { reference?: string; error?: string; fields?: Record<string, string> } = {}
      try {
        data = JSON.parse(xhr.responseText || '{}')
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.reference) {
        o.onProgress?.(1)
        resolve({ reference: data.reference })
      } else if (xhr.status >= 400 && xhr.status < 500) {
        reject(new SubmitError('rejected', data.error || 'Запитването не беше прието. Проверете данните и опитайте отново.', data.fields))
      } else {
        reject(new SubmitError('server', 'Сървърът не отговори правилно. Данните ви са запазени — опитайте отново след малко.'))
      }
    }
    xhr.onerror = () =>
      reject(new SubmitError(navigator.onLine === false ? 'offline' : 'network', 'Връзката прекъсна по време на изпращането. Данните ви са запазени — опитайте отново.'))
    xhr.ontimeout = () => reject(new SubmitError('timeout', 'Изпращането отне твърде дълго (вероятно заради бавна връзка). Опитайте отново или намалете размера на файловете.'))
    xhr.send(body)
  })
}
