import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  areaOptions,
  fieldErrors,
  hasProjectOptions,
  leadSchema,
  constructionMaterialOptions,
  MESSAGE_MAX,
  projectTypeOptions,
  serviceOptions,
  stepSchemas,
  type LeadDraft,
} from '../../lib/lead/schema'
import type { Attachment } from '../../lib/lead/files'
import { clearDraft, isMeaningful, loadDraft, loadDraftFiles, saveDraft, saveDraftFiles, type StoredDraft } from '../../lib/lead/draft'
import { SubmitError, submitLead } from '../../lib/lead/submit'
import { track } from '../../lib/analytics'
import { site } from '../../content/site'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Honeypot, OptionGroup, TextArea, TextField } from './fields'
import { FileUpload } from './FileUpload'
import { Summary } from './Summary'
import { Success } from './Success'
import { DraftPrompt } from './DraftPrompt'
import { SendError, SendProgress } from './SendState'

export const STEPS = [
  { key: 'projectType', title: 'Какъв тип проект имате?' },
  { key: 'service', title: 'Каква услуга ви е необходима?' },
  { key: 'materials', title: 'Какъв материал ви интересува?' },
  { key: 'scope', title: 'Площ и проект' },
  { key: 'location', title: 'Къде се намира обектът?' },
  { key: 'files', title: 'Снимки и файлове' },
  { key: 'contact', title: 'Как да се свържем с вас?' },
] as const
export type StepKey = (typeof STEPS)[number]['key']

const CITIES = ['София', 'Пловдив', 'Варна', 'Бургас', 'Стара Загора', 'Русе', 'Плевен', 'Велико Търново', 'Благоевград', 'Шумен', 'Хасково', 'Пазарджик']

type Phase = 'draft-prompt' | 'form' | 'summary' | 'sending' | 'success'

/** Normalise optional strings so step schemas see '' rather than undefined. */
const norm = (d: LeadDraft) => ({ name: '', phone: '', city: '', company: '', address: '', email: '', message: '', gps: null, ...d })

export function QuoteWizard({ prefill, source }: { prefill: LeadDraft; source: string }) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('form')
  const [pending, setPending] = useState<StoredDraft | null>(null)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [data, setData] = useState<LeadDraft>(prefill)
  const [files, setFiles] = useState<Attachment[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [honeypot, setHoneypot] = useState('')
  const [progress, setProgress] = useState(0)
  const [sendError, setSendError] = useState<SubmitError | null>(null)
  const [reference, setReference] = useState('')
  const [returnTo, setReturnTo] = useState<number | null>(null)
  const [gpsState, setGpsState] = useState<'idle' | 'busy' | 'error'>('idle')
  const startedAt = useRef(Date.now())
  const started = useRef(false)
  const ready = useRef(false)
  const panel = useRef<HTMLDivElement>(null)

  // Restore an unfinished request (asked, never silently)
  useEffect(() => {
    const d = loadDraft()
    if (isMeaningful(d)) {
      setPending(d)
      setPhase('draft-prompt')
    }
    ready.current = true
  }, [])

  // Persist on every change (fields → localStorage, files → IndexedDB)
  useEffect(() => {
    if (!ready.current || phase === 'draft-prompt' || phase === 'success') return
    const t = setTimeout(() => saveDraft(data, step), 250)
    return () => clearTimeout(t)
  }, [data, step, phase])
  useEffect(() => {
    if (!ready.current || phase === 'draft-prompt' || phase === 'success') return
    void saveDraftFiles(files)
  }, [files, phase])

  const update = useCallback((patch: LeadDraft) => {
    if (!started.current) {
      started.current = true
      track('quote_start', { source })
    }
    setData((d) => ({ ...d, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      for (const k of Object.keys(patch)) delete next[k]
      return next
    })
  }, [source])

  const focusPanel = () => requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('h1')?.focus())

  const goTo = (i: number) => {
    setDir(i >= step ? 'fwd' : 'back')
    setErrors({})
    setStep(i)
    setPhase('form')
    window.scrollTo({ top: 0 })
    focusPanel()
  }

  const validateStep = (i: number): boolean => {
    const key = STEPS[i].key
    if (key === 'files') return true
    const res = stepSchemas[key].safeParse(norm(data))
    if (res.success) return true
    const errs = fieldErrors(res.error)
    setErrors(errs)
    requestAnimationFrame(() => {
      const first = Object.keys(errs)[0]
      const el = panel.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)
      ;(el?.matches('input,textarea') ? el : el?.querySelector<HTMLElement>('input'))?.focus()
    })
    return false
  }

  const next = () => {
    if (!validateStep(step)) return
    track('quote_step', { step: step + 1 })
    if (returnTo !== null || step === STEPS.length - 1) {
      setReturnTo(null)
      setPhase('summary')
      window.scrollTo({ top: 0 })
      focusPanel()
    } else goTo(step + 1)
  }
  const back = () => (step === 0 ? navigate(-1) : goTo(step - 1))

  /** Single-choice tap → short visual confirmation, then advance */
  const choose = (patch: LeadDraft, viaPointer: boolean) => {
    update(patch)
    if (viaPointer) setTimeout(() => {
      setDir('fwd')
      if (returnTo !== null) { setReturnTo(null); setPhase('summary') }
      else setStep((s) => Math.min(s + 1, STEPS.length - 1))
      focusPanel()
    }, 220)
  }

  const toggleMaterial = (v: string) => {
    const cur = data.materials ?? []
    let nextList: string[]
    if (v === 'unsure') nextList = cur.includes('unsure') ? [] : ['unsure']
    else nextList = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur.filter((x) => x !== 'unsure'), v]
    update({ materials: nextList })
  }

  const locate = () => {
    if (!('geolocation' in navigator)) return setGpsState('error')
    setGpsState('busy')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({ gps: { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6), accuracy: Math.round(pos.coords.accuracy) } })
        setGpsState('idle')
      },
      () => setGpsState('error'),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  const send = async () => {
    const parsed = leadSchema.safeParse(norm(data))
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error)
      const firstKey = Object.keys(errs)[0]
      const idx = STEPS.findIndex((s) => s.key !== 'files' && firstKey in stepSchemas[s.key].shape)
      goTo(idx >= 0 ? idx : 0)
      setErrors(errs)
      return
    }
    setPhase('sending')
    setSendError(null)
    setProgress(0)
    const { consent: _c, ...lead } = parsed.data
    try {
      const res = await submitLead({ kind: 'full', ...lead }, files, { onProgress: setProgress, honeypot, startedAt: startedAt.current, source })
      await clearDraft()
      setReference(res.reference)
      setPhase('success')
      track('quote_complete', { source, files: files.length })
    } catch (e) {
      setSendError(e instanceof SubmitError ? e : new SubmitError('network', 'Неуспешно изпращане. Опитайте отново.'))
      setPhase('summary')
      if (e instanceof SubmitError && e.fields) setErrors(e.fields)
    }
  }

  // Auto-retry once the connection returns
  useEffect(() => {
    if (sendError?.code !== 'offline') return
    const on = () => void send()
    window.addEventListener('online', on, { once: true })
    return () => window.removeEventListener('online', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendError])

  if (phase === 'draft-prompt' && pending)
    return (
      <DraftPrompt
        draft={pending}
        onResume={async () => {
          setData({ ...pending.data })
          setStep(Math.min(pending.step, STEPS.length - 1))
          setFiles(await loadDraftFiles())
          started.current = true
          setPhase('form')
        }}
        onRestart={async () => {
          await clearDraft()
          setData(prefill)
          setStep(0)
          setFiles([])
          setPhase('form')
        }}
      />
    )

  if (phase === 'success') return <Success reference={reference} email={data.email} />

  const total = STEPS.length
  const isSummary = phase === 'summary' || phase === 'sending'
  const pct = isSummary ? 100 : Math.round((step / total) * 100)

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-2xl flex-col overflow-x-clip">
      {/* Top bar: progress */}
      <div className="sticky top-0 z-30 bg-bg/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl md:px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          <button type="button" onClick={isSummary ? () => goTo(total - 1) : back} className="-ml-2 grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label={step === 0 && !isSummary ? 'Назад към сайта' : 'Предишна стъпка'}>
            <Icon name="arrowLeft" />
          </button>
          <p className="tnum text-[0.9375rem] font-semibold" aria-live="polite" data-testid="step-indicator">
            {isSummary ? 'Обобщение' : `Стъпка ${step + 1} от ${total}`}
          </p>
          <Link to="/" className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Затвори (черновата се запазва)">
            <Icon name="close" />
          </Link>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Напредък на запитването">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
      </div>

      <div ref={panel} key={isSummary ? 'summary' : step} className={`flex-1 px-4 pb-36 pt-6 md:px-6 ${dir === 'fwd' ? 'anim-step-fwd' : 'anim-step-back'}`}>
        {isSummary ? (
          <>
            <Summary data={data} files={files} onEdit={(k) => { setReturnTo(STEPS.findIndex((s) => s.key === k)); goTo(STEPS.findIndex((s) => s.key === k)) }} />
            {sendError && <SendError error={sendError} onRetry={send} />}
          </>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              next()
            }}
            aria-labelledby="step-title"
          >
            <h1 id="step-title" tabIndex={-1} className="text-[clamp(1.75rem,6vw,2.5rem)] outline-none">{STEPS[step].title}</h1>
            <div className="mt-6 grid gap-6">
              {STEPS[step].key === 'projectType' && (
                <OptionGroup legend="Тип на обекта" hideLegend name="projectType" options={projectTypeOptions} value={data.projectType} onChange={(v, p) => choose({ projectType: v }, p)} error={errors.projectType} />
              )}
              {STEPS[step].key === 'service' && (
                <OptionGroup legend="Услуга" hideLegend name="service" columns={1} options={serviceOptions} value={data.service} onChange={(v, p) => choose({ service: v }, p)} error={errors.service} />
              )}
              {STEPS[step].key === 'materials' && (
                <>
                  <p className="-mt-3 text-ink-2">Може да изберете повече от един.</p>
                  <OptionGroup legend="Материал" hideLegend name="materials" multiple options={constructionMaterialOptions} value={data.materials} onChange={toggleMaterial} error={errors.materials} />
                </>
              )}
              {STEPS[step].key === 'scope' && (
                <>
                  <OptionGroup legend="Приблизителна площ на фасадата" name="area" options={areaOptions} value={data.area} onChange={(v) => update({ area: v })} error={errors.area} />
                  <OptionGroup legend="Имате ли готов проект?" name="hasProject" options={hasProjectOptions} value={data.hasProject} onChange={(v) => update({ hasProject: v })} error={errors.hasProject} />
                  {(data.hasProject === 'no' || data.hasProject === 'unsure') && (
                    <p className="rounded-2xl bg-accent-soft p-4 text-ink anim-pop">Няма проблем — снимки на сградата и кратко описание са достатъчни за първа оценка.</p>
                  )}
                </>
              )}
              {STEPS[step].key === 'location' && (
                <>
                  <TextField label="Град / населено място" name="city" list="cities" autoComplete="address-level2" value={data.city ?? ''} onChange={(e) => update({ city: e.target.value })} error={errors.city} placeholder="напр. Пловдив" enterKeyHint="next" />
                  <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
                  <TextField label="Адрес" name="address" optional autoComplete="street-address" value={data.address ?? ''} onChange={(e) => update({ address: e.target.value })} error={errors.address} placeholder="улица, номер, квартал" enterKeyHint="next" />
                  <div>
                    {data.gps ? (
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                        <span className="flex items-center gap-3"><Icon name="pin" className="h-5 w-5 shrink-0 text-accent" /> Локацията е добавена{data.gps.accuracy ? ` (±${data.gps.accuracy} m)` : ''}</span>
                        <button type="button" className="min-h-11 px-2 font-semibold text-accent" onClick={() => update({ gps: null })}>Премахни</button>
                      </div>
                    ) : (
                      <Button variant="ghost" iconLeft="locate" onClick={locate} disabled={gpsState === 'busy'} className="w-full sm:w-auto">
                        {gpsState === 'busy' ? 'Определяне…' : 'Използвай моята локация'}
                      </Button>
                    )}
                    {gpsState === 'error' && <p className="mt-2 text-[0.9375rem] text-danger" role="alert">Локацията не беше определена. Разрешете достъп до местоположение или въведете адреса ръчно.</p>}
                    <p className="mt-2 text-sm text-ink-3">По желание — само ако сте на обекта. Координатите се изпращат единствено с вашето запитване.</p>
                  </div>
                </>
              )}
              {STEPS[step].key === 'files' && (
                <>
                  <p className="-mt-3 text-ink-2">По желание, но много помага за точна оферта.</p>
                  <ul className="grid grid-cols-2 gap-2 text-[0.9375rem] sm:grid-cols-3">
                    {['Снимка на сградата', 'Архитектурен чертеж', 'Фасада', 'Детайл', 'PDF проект'].map((t) => (
                      <li key={t} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5"><Icon name="check" className="h-4 w-4 shrink-0 text-accent" />{t}</li>
                    ))}
                  </ul>
                  <FileUpload files={files} onChange={setFiles} />
                </>
              )}
              {STEPS[step].key === 'contact' && (
                <>
                  <TextField label="Име" name="name" autoComplete="name" value={data.name ?? ''} onChange={(e) => update({ name: e.target.value })} error={errors.name} enterKeyHint="next" />
                  <TextField label="Телефон" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={data.phone ?? ''} onChange={(e) => update({ phone: e.target.value })} error={errors.phone} placeholder="0888 123 456" enterKeyHint="next" />
                  <TextField label="Email" name="email" type="email" inputMode="email" autoComplete="email" optional value={data.email ?? ''} onChange={(e) => update({ email: e.target.value })} error={errors.email} hint="За потвърждение на запитването по email." enterKeyHint="next" />
                  <TextField label="Фирма" name="company" autoComplete="organization" optional value={data.company ?? ''} onChange={(e) => update({ company: e.target.value })} error={errors.company} enterKeyHint="next" />
                  <TextArea label="Опишете накратко вашия проект" name="message" optional maxLength={MESSAGE_MAX} value={data.message ?? ''} onChange={(e) => update({ message: e.target.value })} error={errors.message} counter={{ value: (data.message ?? '').length, max: MESSAGE_MAX }} placeholder="напр. 4-етажна офис сграда, търсим нова облицовка на уличната фасада…" />
                  <div data-field="consent">
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4">
                      <input type="checkbox" checked={Boolean(data.consent)} onChange={(e) => update({ consent: e.target.checked })} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--accent)]" aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? 'consent-err' : undefined} />
                      <span className="text-[0.9375rem] leading-snug text-ink-2">
                        Съгласен/на съм данните ми да бъдат обработени, за да получа оферта, съгласно{' '}
                        <Link to="/poveritelnost" target="_blank" className="font-semibold text-ink underline underline-offset-2">Политиката за поверителност</Link>.
                      </span>
                    </label>
                    {errors.consent && <p id="consent-err" className="mt-2 text-[0.9375rem] font-medium text-danger" role="alert">{errors.consent}</p>}
                  </div>
                  <Honeypot value={honeypot} onChange={setHoneypot} />
                </>
              )}
            </div>
            <button type="submit" className="sr-only" tabIndex={-1}>Напред</button>
          </form>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
          {isSummary ? (
            phase === 'sending' ? (
              <SendProgress value={progress} hasFiles={files.length > 0} />
            ) : (
              <Button size="lg" className="w-full" icon="send" onClick={send} data-testid="submit-quote">
                Изпрати запитване
              </Button>
            )
          ) : (
            <>
              {step > 0 && (
                <Button variant="ghost" size="lg" onClick={back} className="w-14 !px-0" aria-label="Назад">
                  <Icon name="arrowLeft" />
                </Button>
              )}
              <Button size="lg" className="flex-1" icon="arrow" onClick={next} data-testid="next-step">
                {returnTo !== null ? 'Запази' : step === total - 1 ? 'Преглед на запитването' : STEPS[step].key === 'files' && files.length === 0 ? 'Пропусни' : 'Напред'}
              </Button>
            </>
          )}
        </div>
        {!isSummary && step === 0 && (
          <p className="mx-auto max-w-2xl px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-sm text-ink-3 md:px-6">
            {site.responseTime && <>Отговор: {site.responseTime} · </>}<Link to="/zapitvane?rezhim=barzo" className="font-semibold text-ink underline underline-offset-2">Бързо запитване</Link>
          </p>
        )}
      </div>
    </div>
  )
}
