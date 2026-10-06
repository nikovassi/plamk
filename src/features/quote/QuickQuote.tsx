import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { fieldErrors, materialOptions, MESSAGE_MAX, quickLeadSchema } from '../../lib/lead/schema'
import type { Attachment } from '../../lib/lead/files'
import { SubmitError, submitLead } from '../../lib/lead/submit'
import { track } from '../../lib/analytics'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Honeypot, OptionGroup, TextArea, TextField } from './fields'
import { FileUpload } from './FileUpload'
import { Success } from './Success'
import { SendError, SendProgress } from './SendState'

/** One-screen request for visitors who prefer to talk first. */
export function QuickQuote({ source, material, product }: { source: string; material?: string; product?: string }) {
  const [d, setD] = useState({ name: '', phone: '', city: '', material: material ?? '', message: product ? `${product}: ` : '', consent: false })
  const [files, setFiles] = useState<Attachment[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hp, setHp] = useState('')
  const [state, setState] = useState<'form' | 'sending' | 'success'>('form')
  const [progress, setProgress] = useState(0)
  const [err, setErr] = useState<SubmitError | null>(null)
  const [ref, setRef] = useState('')
  const startedAt = useRef(Date.now())
  const form = useRef<HTMLFormElement>(null)
  const set = (patch: Partial<typeof d>) => {
    setD((x) => ({ ...x, ...patch }))
    setErrors((e) => { const n = { ...e }; Object.keys(patch).forEach((k) => delete n[k]); return n })
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const res = quickLeadSchema.safeParse(d)
    if (!res.success) {
      const errs = fieldErrors(res.error)
      setErrors(errs)
      requestAnimationFrame(() => {
        const el = form.current?.querySelector<HTMLElement>(`[data-field="${Object.keys(errs)[0]}"]`)
        ;(el?.matches('input,textarea') ? el : el?.querySelector<HTMLElement>('input'))?.focus()
      })
      return
    }
    setState('sending')
    setErr(null)
    const { consent: _c, ...lead } = res.data
    try {
      const r = await submitLead({ kind: 'quick', ...lead }, files, { onProgress: setProgress, honeypot: hp, startedAt: startedAt.current, source })
      setRef(r.reference)
      setState('success')
      track('quick_quote_complete', { source })
    } catch (x) {
      setErr(x instanceof SubmitError ? x : new SubmitError('network', 'Неуспешно изпращане.'))
      setState('form')
    }
  }

  if (state === 'success') return <Success reference={ref} />

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-36 pt-[max(1rem,env(safe-area-inset-top))] md:px-6">
      <div className="flex h-14 items-center justify-between">
        <Link to="/" className="-ml-2 grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Затвори"><Icon name="close" /></Link>
        <Link to="/zapitvane" className="inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-accent">Пълно запитване →</Link>
      </div>
      <h1 className="mt-4 text-[clamp(2rem,7vw,2.75rem)]">Бързо запитване</h1>
      <p className="mt-2 text-ink-2">Оставете телефон — ще ви се обадим, за да уточним детайлите, наличност и цена.</p>
      <form ref={form} noValidate onSubmit={submit} className="mt-8 grid gap-6" aria-label="Бързо запитване">
        <TextField label="Име" name="name" autoComplete="name" value={d.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
        <TextField label="Телефон" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={d.phone} onChange={(e) => set({ phone: e.target.value })} error={errors.phone} placeholder="0888 123 456" />
        <TextField label="Град" name="city" autoComplete="address-level2" value={d.city} onChange={(e) => set({ city: e.target.value })} error={errors.city} />
        <OptionGroup legend="Какво ви интересува?" name="material" columns={3} options={materialOptions} value={d.material} onChange={(v) => set({ material: v })} error={errors.material} />
        <TextArea label="Кратко описание или количество" name="message" maxLength={MESSAGE_MAX} value={d.message} onChange={(e) => set({ message: e.target.value })} error={errors.message} placeholder="напр. фасада на къща, 120 m² · стреч фолио, 20 ролки · СТМ за 12 служители" />
        <div>
          <p className="mb-2 text-[0.9375rem] font-semibold">Снимка <span className="font-normal text-ink-3">· по желание</span></p>
          <FileUpload files={files} onChange={setFiles} compact />
        </div>
        <div data-field="consent">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4">
            <input type="checkbox" checked={d.consent} onChange={(e) => set({ consent: e.target.checked })} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--accent)]" aria-invalid={errors.consent ? true : undefined} />
            <span className="text-[0.9375rem] leading-snug text-ink-2">Съгласен/на съм данните ми да бъдат обработени, за да получа оферта, съгласно <Link to="/poveritelnost" target="_blank" className="font-semibold text-ink underline underline-offset-2">Политиката за поверителност</Link>.</span>
          </label>
          {errors.consent && <p className="mt-2 text-[0.9375rem] font-medium text-danger" role="alert">{errors.consent}</p>}
        </div>
        <Honeypot value={hp} onChange={setHp} />
        {err && <SendError error={err} onRetry={() => void submit()} />}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
            {state === 'sending' ? <SendProgress value={progress} hasFiles={files.length > 0} /> : <Button type="submit" size="lg" className="w-full" icon="send">Изпрати</Button>}
          </div>
        </div>
      </form>
    </div>
  )
}
