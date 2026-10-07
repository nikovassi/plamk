// Supabase Edge Function: receives a quote request (multipart/form-data) from the static site.
// Deploy:  supabase functions deploy submit-lead --no-verify-jwt
// Secrets: supabase secrets set ALLOWED_ORIGINS=https://nikovassi.github.io \
//            LEAD_NOTIFY_EMAILS='{"recom":"office@recom.bg","plamk":"office@plamk.net"}' \
//            RESEND_API_KEY=... LEAD_FROM_EMAIL="Запитвания <noreply@…>"   (email is optional)
// One function serves both sites (РЕКОМ ГРУП and ПЛАМК); each lead stores `site`.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically. Nothing secret lives in the frontend.
//
// Keep the enums/limits below in sync with src/lib/lead/schema.ts and src/lib/lead/files.ts.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@4'

const MAX_FILES = 8
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_TOTAL_BYTES = 25 * 1024 * 1024
const MIN_ELAPSED_MS = 2500 // bots submit instantly

const KINDS: Record<string, { mime: string[]; magic: number[][]; store: string }> = {
  pdf: { mime: ['application/pdf'], magic: [[0x25, 0x50, 0x44, 0x46]], store: 'application/pdf' },
  jpg: { mime: ['image/jpeg'], magic: [[0xff, 0xd8, 0xff]], store: 'image/jpeg' },
  jpeg: { mime: ['image/jpeg'], magic: [[0xff, 0xd8, 0xff]], store: 'image/jpeg' },
  png: { mime: ['image/png'], magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], store: 'image/png' },
  dwg: {
    mime: ['', 'application/octet-stream', 'application/acad', 'application/x-acad', 'application/autocad_dwg', 'image/vnd.dwg', 'image/x-dwg', 'application/dwg', 'application/x-dwg'],
    magic: [[0x41, 0x43, 0x31, 0x30]],
    store: 'application/octet-stream',
  },
}

const PHONE = z.string().trim().regex(/^\+?[\d\s\-().]{6,20}$/).refine((v) => { const d = v.replace(/\D/g, '').length; return d >= 9 && d <= 15 }, 'Невалиден телефон.')
const optStr = (max: number) => z.string().trim().max(max).optional().default('')
const email = z.string().trim().max(160).refine((v) => v === '' || z.email().safeParse(v).success, 'Невалиден email.').optional().default('')

const SITE = z.enum(['recom', 'plamk']).optional().default('recom')

const full = z.object({
  kind: z.literal('full'),
  site: SITE,
  projectType: z.enum(['residential', 'office', 'retail', 'hotel', 'industrial', 'public', 'other']),
  service: z.enum(['design', 'supply', 'install', 'full', 'consult', 'unsure']),
  materials: z.array(z.enum(['al-bond', 'hpl', 'keramika', 'metal', 'paper', 'film', 'stm', 'combo', 'unsure'])).min(1).max(6),
  area: z.enum(['lt50', '50-100', '100-250', '250-500', '500-1000', 'gt1000', 'unknown']),
  hasProject: z.enum(['yes', 'no', 'in-progress', 'unsure']),
  city: z.string().trim().min(2).max(80),
  address: optStr(160),
  gps: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracy: z.number().optional() }).nullable().optional(),
  name: z.string().trim().min(2).max(80),
  company: optStr(120),
  phone: PHONE,
  email,
  message: z.string().trim().max(2000).refine((v) => v.length === 0 || v.length >= 10).optional().default(''),
  consent: z.literal(true),
  source: optStr(80),
})
const quick = z.object({
  kind: z.literal('quick'),
  site: SITE,
  name: z.string().trim().min(2).max(80),
  phone: PHONE,
  city: z.string().trim().min(2).max(80),
  material: z.enum(['al-bond', 'hpl', 'keramika', 'metal', 'paper', 'film', 'stm', 'combo', 'unsure']),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal(true),
  source: optStr(80),
})
const payloadSchema = z.discriminatedUnion('kind', [full, quick])

const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
function cors(origin: string | null) {
  const ok = origin && (allowed.length === 0 || allowed.includes(origin))
  return {
    'Access-Control-Allow-Origin': ok ? origin! : allowed[0] ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}
const json = (body: unknown, status: number, h: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json; charset=utf-8' } })

/** Legacy service_role JWT, or the new secret key (SUPABASE_SECRET_KEYS = {"default": "sb_secret_…"}) */
function serviceKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (legacy) return legacy
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>
    return keys.default ?? Object.values(keys)[0] ?? ''
  } catch {
    return ''
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const safeName = (n: string) => n.normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').slice(-80) || 'file'

async function sendMail(to: string, subject: string, html: string, replyTo?: string) {
  const key = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('LEAD_FROM_EMAIL')
  if (!key || !from) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  })
  if (!res.ok) console.error('email failed', res.status, await res.text())
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, h)
  const origin = req.headers.get('origin')
  if (allowed.length && (!origin || !allowed.includes(origin))) return json({ error: 'Origin not allowed' }, 403, h)

  const len = Number(req.headers.get('content-length') ?? 0)
  if (len > MAX_TOTAL_BYTES + 1024 * 1024) return json({ error: 'Файловете са твърде големи.' }, 413, h)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return json({ error: 'Невалидна заявка.' }, 400, h)
  }

  // Spam protection: honeypot + minimum fill time. Respond "success-like" without storing.
  if (String(form.get('website') ?? '') !== '' || Number(form.get('elapsedMs') ?? 0) < MIN_ELAPSED_MS)
    return json({ reference: 'REQ-0000-0000' }, 200, h)

  let raw: unknown
  try {
    raw = JSON.parse(String(form.get('payload') ?? ''))
  } catch {
    return json({ error: 'Невалидни данни.' }, 400, h)
  }
  const parsed = payloadSchema.safeParse(raw)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= 'Проверете това поле.'
    return json({ error: 'Някои полета са невалидни.', fields }, 422, h)
  }
  const p = parsed.data

  // File validation (never trust the client)
  const files = form.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length > MAX_FILES) return json({ error: `Максимум ${MAX_FILES} файла.` }, 422, h)
  let total = 0
  const checked: { file: File; bytes: Uint8Array; mime: string }[] = []
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    const spec = KINDS[ext]
    if (!spec) return json({ error: `„${f.name}“: неподдържан формат.` }, 422, h)
    if (f.size === 0 || f.size > MAX_FILE_BYTES) return json({ error: `„${f.name}“: недопустим размер.` }, 422, h)
    if (!spec.mime.includes(f.type.toLowerCase())) return json({ error: `„${f.name}“: типът не съответства на разширението.` }, 422, h)
    const bytes = new Uint8Array(await f.arrayBuffer())
    if (!spec.magic.some((sig) => sig.every((b, i) => bytes[i] === b))) return json({ error: `„${f.name}“: файлът е повреден или с грешен формат.` }, 422, h)
    total += f.size
    checked.push({ file: f, bytes, mime: spec.store })
  }
  if (total > MAX_TOTAL_BYTES) return json({ error: 'Общият размер на файловете е твърде голям.' }, 413, h)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey(), { auth: { persistSession: false } })

  // Basic abuse limit: max 5 requests per phone per hour
  const since = new Date(Date.now() - 3600_000).toISOString()
  const { count } = await db.from('leads').select('id', { count: 'exact', head: true }).eq('phone', p.phone).gte('created_at', since)
  if ((count ?? 0) >= 5) return json({ error: 'Твърде много запитвания. Моля, обадете се по телефона.' }, 429, h)

  const { data: ref, error: refErr } = await db.rpc('next_lead_reference')
  if (refErr) {
    console.error(refErr)
    return json({ error: 'Временен проблем. Опитайте отново.' }, 500, h)
  }

  const row =
    p.kind === 'full'
      ? { kind: 'full', site: p.site, reference: ref, name: p.name, company: p.company || null, phone: p.phone, email: p.email || null, project_type: p.projectType, service: p.service, materials: p.materials, area: p.area, city: p.city, address: p.address || null, gps: p.gps ?? null, has_project: p.hasProject, message: p.message || null, source: p.source || null, consent_at: new Date().toISOString() }
      : { kind: 'quick', site: p.site, reference: ref, name: p.name, phone: p.phone, materials: [p.material], city: p.city, message: p.message, source: p.source || null, consent_at: new Date().toISOString() }

  const { data: lead, error: insErr } = await db.from('leads').insert(row).select('id, reference').single()
  if (insErr || !lead) {
    console.error(insErr)
    return json({ error: 'Временен проблем. Опитайте отново.' }, 500, h)
  }

  const stored: { name: string; size: number }[] = []
  for (const c of checked) {
    const path = `${lead.id}/${crypto.randomUUID()}-${safeName(c.file.name)}`
    const up = await db.storage.from('lead-files').upload(path, c.bytes, { contentType: c.mime, upsert: false })
    if (up.error) {
      console.error(up.error)
      continue
    }
    await db.from('lead_files').insert({ lead_id: lead.id, path, name: c.file.name.slice(0, 200), mime: c.mime, size: c.file.size })
    stored.push({ name: c.file.name, size: c.file.size })
  }

  // Notifications (failures are logged, never block the customer)
  let notify: string | undefined
  try {
    notify = JSON.parse(Deno.env.get('LEAD_NOTIFY_EMAILS') ?? '{}')[p.site]
  } catch {
    notify = undefined
  }
  notify ??= Deno.env.get('LEAD_NOTIFY_EMAIL') ?? undefined
  const lines = Object.entries(row)
    .filter(([k, v]) => v && !['consent_at', 'reference', 'kind', 'site'].includes(k))
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td>${esc(typeof v === 'string' ? v : JSON.stringify(v))}</td></tr>`)
    .join('')
  const tasks: Promise<unknown>[] = []
  if (notify)
    tasks.push(sendMail(notify, `[${p.site === 'plamk' ? 'ПЛАМК' : 'РЕКОМ ГРУП'}] Ново запитване ${lead.reference} — ${p.city}`, `<h2>${lead.reference}</h2><table>${lines}</table><p>Файлове: ${stored.map((s) => esc(s.name)).join(', ') || 'няма'}</p>`, p.kind === 'full' && p.email ? p.email : undefined))
  if (p.kind === 'full' && p.email)
    tasks.push(sendMail(p.email, `Получихме вашето запитване ${lead.reference}`, `<p>Здравейте, ${esc(p.name)},</p><p>Получихме вашето запитване.</p><p>Номер: <strong>${lead.reference}</strong></p><p>Ще се свържем с вас след преглед на информацията.</p>`))
  await Promise.allSettled(tasks)

  return json({ reference: lead.reference, files: stored.length }, 200, h)
})
