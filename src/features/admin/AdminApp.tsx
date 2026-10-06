import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { TextField } from '../quote/fields'
import { areaOptions, hasProjectOptions, labelOf, materialOptions, projectTypeOptions, serviceOptions } from '../../lib/lead/schema'
import { formatBytes } from '../../lib/lead/files'
import { STATUSES, type LeadNote, type LeadRow, type LeadStatus } from './types'
import { Logo } from '../../components/layout/Logo'

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
let client: SupabaseClient | null = null
const sb = () => (client ??= createClient(URL_!, KEY!, { auth: { persistSession: true, storageKey: 'admin-auth' } }))

const fmtDate = (s: string) => new Date(s).toLocaleString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const statusMeta = (s: LeadStatus) => STATUSES.find((x) => x.value === s)!

export default function AdminApp() {
  useEffect(() => {
    let m = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m) }
    m.content = 'noindex, nofollow'
    document.title = 'Запитвания — администрация'
  }, [])
  if (!URL_ || !KEY)
    return (
      <Shell>
        <div className="mx-auto max-w-lg rounded-[22px] border border-line bg-surface p-6">
          <h1 className="text-2xl">Администрацията не е конфигурирана</h1>
          <p className="mt-3 text-ink-2">Задайте <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code> при build-а и изпълнете миграциите в <code>supabase/migrations</code>. Вижте README → „Backend“.</p>
        </div>
      </Shell>
    )
  return <Authed />
}

function Shell({ children, onLogout }: { children: React.ReactNode; onLogout?: () => void }) {
  return (
    <div className="min-h-[100svh] bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between">
          <span className="flex items-center gap-3"><Logo /><span className="hidden text-sm text-ink-3 sm:inline">· Запитвания</span></span>
          {onLogout && <Button variant="ghost" size="sm" onClick={onLogout}>Изход</Button>}
        </div>
      </header>
      <main className="container-x py-6">{children}</main>
    </div>
  )
}

function Authed() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    sb().auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = sb().auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (session === undefined) return <Shell><p className="text-ink-3">Зареждане…</p></Shell>
  if (!session) return <Shell><Login /></Shell>
  return <Shell onLogout={() => void sb().auth.signOut()}><Dashboard email={session.user.email ?? ''} /></Shell>
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <form
      className="mx-auto mt-10 grid max-w-sm gap-4 rounded-[22px] border border-line bg-surface p-6"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr('')
        const { error } = await sb().auth.signInWithPassword({ email, password })
        setBusy(false)
        if (error) setErr('Невалиден email или парола.')
      }}
    >
      <h1 className="text-2xl">Вход</h1>
      <TextField label="Email" name="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Парола" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={err} />
      <Button type="submit" size="lg" disabled={busy}>{busy ? 'Влизане…' : 'Вход'}</Button>
    </form>
  )
}

function Dashboard({ email }: { email: string }) {
  const [rows, setRows] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<LeadStatus | 'all'>('new')
  const [q, setQ] = useState('')
  const [material, setMaterial] = useState('')
  const [city, setCity] = useState('')
  const [ptype, setPtype] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await sb().from('leads').select('*, lead_files(*)').order('created_at', { ascending: false }).limit(1000)
    setLoading(false)
    if (error) setError(error.message.includes('permission') ? 'Нямате права за достъп до запитванията.' : error.message)
    else setRows(data as LeadRow[])
  }, [])
  useEffect(() => { void load() }, [load])

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s.value, rows.filter((r) => r.status === s.value).length])), [rows])
  const cities = useMemo(() => [...new Set(rows.map((r) => r.city))].sort((a, b) => a.localeCompare(b, 'bg')), [rows])
  const needle = q.trim().toLowerCase()
  const list = rows.filter(
    (r) =>
      (status === 'all' || r.status === status) &&
      (!material || r.materials.includes(material)) &&
      (!city || r.city === city) &&
      (!ptype || r.project_type === ptype) &&
      (!from || r.created_at >= from) &&
      (!to || r.created_at <= `${to}T23:59:59`) &&
      (!needle || [r.reference, r.name, r.company, r.phone, r.email, r.city, r.message].some((v) => v?.toLowerCase().includes(needle))),
  )
  const open = rows.find((r) => r.id === openId) ?? null
  const selectCls = 'h-11 rounded-full border border-line bg-surface px-4 text-[0.9375rem]'

  const setLeadStatus = async (id: string, s: LeadStatus) => {
    const { error } = await sb().from('leads').update({ status: s }).eq('id', id)
    if (!error) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: s } : r)))
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl">Запитвания</h1>
          <p className="text-sm text-ink-3">{email}</p>
        </div>
        <label className="relative block md:w-80">
          <span className="sr-only">Търсене</span>
          <Icon name="search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Търси: име, телефон, REQ…" className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4" />
        </label>
      </div>
      <div className="-mx-4 mt-5 md:-mx-8">
        <div className="snap-row !gap-2">
          <Chip active={status === 'all'} onClick={() => setStatus('all')} count={rows.length}>Всички</Chip>
          {STATUSES.map((s) => <Chip key={s.value} active={status === s.value} onClick={() => setStatus(s.value)} count={counts[s.value]}>{s.label}</Chip>)}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select aria-label="Материал" className={selectCls} value={material} onChange={(e) => setMaterial(e.target.value)}>
          <option value="">Материал: всички</option>
          {materialOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select aria-label="Град" className={selectCls} value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Град: всички</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Тип обект" className={selectCls} value={ptype} onChange={(e) => setPtype(e.target.value)}>
          <option value="">Тип обект: всички</option>
          {projectTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-3">От <input type="date" className={selectCls} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm text-ink-3">До <input type="date" className={selectCls} value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <Button variant="ghost" size="sm" iconLeft="refresh" onClick={() => void load()}>Обнови</Button>
      </div>

      {error && <p className="mt-6 rounded-2xl bg-danger/10 p-4 text-danger" role="alert">{error}</p>}
      {loading ? <p className="mt-6 text-ink-3">Зареждане…</p> : (
        <div className="mt-6 overflow-hidden rounded-[22px] border border-line bg-surface">
          <table className="w-full text-left text-[0.9375rem]">
            <thead className="hidden bg-surface-2 text-sm text-ink-3 md:table-header-group">
              <tr><th className="p-3">Дата</th><th className="p-3">Клиент</th><th className="p-3">Контакт</th><th className="p-3">Материал</th><th className="p-3">Обект</th><th className="p-3">Локация</th><th className="p-3">Статус</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((r) => (
                <tr key={r.id} className="grid cursor-pointer grid-cols-2 gap-1 p-4 hover:bg-surface-2 md:table-row md:p-0" onClick={() => setOpenId(r.id)}>
                  <td className="text-ink-3 md:p-3"><span className="tnum block font-semibold text-ink">{r.reference}</span>{fmtDate(r.created_at)}</td>
                  <td className="text-right md:p-3 md:text-left"><button type="button" className="font-semibold hover:underline" onClick={() => setOpenId(r.id)}>{r.name}</button>{r.company && <span className="block text-ink-3">{r.company}</span>}</td>
                  <td className="md:p-3"><a href={`tel:${r.phone}`} onClick={(e) => e.stopPropagation()} className="block">{r.phone}</a>{r.email && <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()} className="block truncate text-ink-3">{r.email}</a>}</td>
                  <td className="text-right md:p-3 md:text-left">{r.materials.map((m) => labelOf(materialOptions, m)).join(', ') || '—'}</td>
                  <td className="md:p-3">{labelOf(projectTypeOptions, r.project_type ?? undefined)}{r.kind === 'quick' && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs">бързо</span>}</td>
                  <td className="text-right md:p-3 md:text-left">{r.city}</td>
                  <td className="col-span-2 md:p-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta(r.status).tone}`}>{statusMeta(r.status).label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-8 text-center text-ink-3">Няма запитвания по тези критерии.</p>}
        </div>
      )}
      {open && <LeadDetail lead={open} onClose={() => setOpenId(null)} onStatus={(s) => void setLeadStatus(open.id, s)} />}
    </>
  )
}

function LeadDetail({ lead, onClose, onStatus }: { lead: LeadRow; onClose: () => void; onStatus: (s: LeadStatus) => void }) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [note, setNote] = useState('')
  const [links, setLinks] = useState<Record<string, string>>({})
  useEffect(() => {
    sb().from('lead_notes').select('*').eq('lead_id', lead.id).order('created_at').then(({ data }) => setNotes((data as LeadNote[]) ?? []))
    if (lead.lead_files.length)
      sb().storage.from('lead-files').createSignedUrls(lead.lead_files.map((f) => f.path), 600).then(({ data }) => {
        const m: Record<string, string> = {}
        data?.forEach((d) => { if (d.path && d.signedUrl) m[d.path] = d.signedUrl })
        setLinks(m)
      })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lead, onClose])

  const addNote = async () => {
    const body = note.trim()
    if (!body) return
    const { data, error } = await sb().from('lead_notes').insert({ lead_id: lead.id, body }).select().single()
    if (!error && data) { setNotes((n) => [...n, data as LeadNote]); setNote('') }
  }
  const rows: [string, React.ReactNode][] = [
    ['Клиент', <>{lead.name}{lead.company ? `, ${lead.company}` : ''}</>],
    ['Телефон', <a className="text-accent" href={`tel:${lead.phone}`}>{lead.phone}</a>],
    ['Email', lead.email ? <a className="text-accent" href={`mailto:${lead.email}`}>{lead.email}</a> : '—'],
    ['Тип обект', labelOf(projectTypeOptions, lead.project_type ?? undefined)],
    ['Услуга', labelOf(serviceOptions, lead.service ?? undefined)],
    ['Материал', lead.materials.map((m) => labelOf(materialOptions, m)).join(', ') || '—'],
    ['Площ', labelOf(areaOptions, lead.area ?? undefined)],
    ['Готов проект', labelOf(hasProjectOptions, lead.has_project ?? undefined)],
    ['Локация', <>{lead.city}{lead.address ? `, ${lead.address}` : ''}{lead.gps && <> · <a className="text-accent" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${lead.gps.lat},${lead.gps.lng}`}>карта</a></>}</>],
    ['Източник', lead.source || '—'],
    ['Дата', fmtDate(lead.created_at)],
  ]
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Запитване ${lead.reference}`}>
      <div className="absolute inset-0 bg-[var(--scrim)]" onClick={onClose} />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-bg p-5 shadow-float anim-step-fwd md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="tnum text-sm text-ink-3">{lead.reference}</p><h2 className="text-2xl">{lead.name}</h2></div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Затвори"><Icon name="close" /></button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Статус">
          {STATUSES.map((s) => <Chip key={s.value} active={lead.status === s.value} onClick={() => onStatus(s.value)}>{s.label}</Chip>)}
        </div>
        <dl className="mt-6 divide-y divide-line rounded-[22px] border border-line bg-surface">
          {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 p-3"><dt className="text-sm text-ink-3">{k}</dt><dd>{v}</dd></div>)}
        </dl>
        {lead.message && <><h3 className="mt-6 eyebrow">Описание</h3><p className="mt-2 whitespace-pre-line rounded-2xl bg-surface p-4">{lead.message}</p></>}
        <h3 className="mt-6 eyebrow">Файлове</h3>
        {lead.lead_files.length ? (
          <ul className="mt-2 grid gap-2">
            {lead.lead_files.map((f) => (
              <li key={f.id}><a href={links[f.path]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 hover:border-ink-3"><span className="truncate">{f.name}</span><span className="shrink-0 text-sm text-ink-3">{formatBytes(f.size)}</span></a></li>
            ))}
          </ul>
        ) : <p className="mt-2 text-ink-3">Няма прикачени файлове.</p>}
        <h3 className="mt-6 eyebrow">Вътрешни бележки</h3>
        <ul className="mt-2 grid gap-2">
          {notes.map((n) => <li key={n.id} className="rounded-2xl bg-surface p-3"><p className="whitespace-pre-line">{n.body}</p><p className="mt-1 text-xs text-ink-3">{n.author_email} · {fmtDate(n.created_at)}</p></li>)}
        </ul>
        <div className="mt-3 grid gap-2">
          <label htmlFor="note" className="sr-only">Нова бележка</label>
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Добави вътрешна бележка…" className="w-full rounded-2xl border border-line bg-surface p-3" />
          <Button onClick={() => void addNote()} disabled={!note.trim()} iconLeft="plus">Добави бележка</Button>
        </div>
      </aside>
    </div>
  )
}
