import { useId, useRef, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Icon } from '../../components/ui/Icon'

export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-[0.9375rem] font-medium text-danger" role="alert">
      <span aria-hidden="true">!</span>
      <span>{children}</span>
    </p>
  )
}

interface TextProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  name: string
  error?: string
  hint?: ReactNode
  optional?: boolean
}

const inputCls = (err?: string) =>
  `block h-14 w-full rounded-2xl border bg-surface px-4 text-[1.0625rem] text-ink placeholder:text-ink-3 transition-colors focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${
    err ? 'border-danger' : 'border-line'
  }`

export function TextField({ label, name, error, hint, optional, ...rest }: TextProps) {
  const id = useId()
  const errId = `${id}-err`
  const hintId = `${id}-hint`
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-[0.9375rem] font-semibold">
        <span>{label}</span>
        {optional && <span className="text-sm font-normal text-ink-3">по желание</span>}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error && errId, hint && hintId].filter(Boolean).join(' ') || undefined}
        data-field={name}
        className={inputCls(error)}
        {...rest}
      />
      {hint && !error && <p id={hintId} className="mt-2 text-sm text-ink-3">{hint}</p>}
      <FieldError id={errId}>{error}</FieldError>
    </div>
  )
}

interface AreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  name: string
  error?: string
  optional?: boolean
  counter?: { value: number; max: number }
}

export function TextArea({ label, name, error, optional, counter, ...rest }: AreaProps) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-[0.9375rem] font-semibold">
        <span>{label}</span>
        {optional && <span className="text-sm font-normal text-ink-3">по желание</span>}
      </label>
      <textarea
        id={id}
        name={name}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        data-field={name}
        className={`${inputCls(error)} h-auto min-h-32 py-3 leading-relaxed`}
        {...rest}
      />
      <div className="flex justify-between gap-3">
        <FieldError id={errId}>{error}</FieldError>
        {counter && <span className="tnum ml-auto mt-2 text-sm text-ink-3">{counter.value}/{counter.max}</span>}
      </div>
    </div>
  )
}

export interface Option { value: string; label: string; hint?: string }

/** Large touch-target choices. `multiple` → checkboxes semantics, otherwise radio. */
export function OptionGroup({
  legend,
  name,
  options,
  value,
  onChange,
  multiple,
  error,
  columns = 2,
  hideLegend,
}: {
  legend: string
  name: string
  options: readonly Option[]
  value: string | string[] | undefined
  /** viaPointer: chosen by tap/click (wizard may auto-advance), false for keyboard */
  onChange: (v: string, viaPointer: boolean) => void
  multiple?: boolean
  error?: string
  columns?: 1 | 2 | 3
  hideLegend?: boolean
}) {
  const id = useId()
  const lastPointer = useRef(0)
  const viaPointer = () => Date.now() - lastPointer.current < 1200
  const selected = (v: string) => (Array.isArray(value) ? value.includes(v) : value === v)
  const grid = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 min-[380px]:grid-cols-2'
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined} data-field={name}>
      <legend className={hideLegend ? 'sr-only' : 'mb-3 text-[0.9375rem] font-semibold'}>{legend}</legend>
      <div className={`grid gap-2 ${grid}`} role={multiple ? 'group' : 'radiogroup'}>
        {options.map((o) => {
          const on = selected(o.value)
          return (
            <label
              key={o.value}
              onPointerDown={() => { lastPointer.current = Date.now() }}
              className={`relative flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-[1.0625rem] font-medium transition-[border,background,transform] duration-150 active:scale-[0.98] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                on ? 'border-ink bg-ink text-bg' : 'border-line bg-surface hover:border-ink-3'
              }`}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                value={o.value}
                checked={on}
                onChange={() => onChange(o.value, viaPointer())}
                onClick={(e) => {
                  // re-tapping the already selected radio still advances
                  if (!multiple && on && viaPointer()) onChange(o.value, true)
                  e.stopPropagation()
                }}
                className="sr-only"
              />
              <span className={`grid h-6 w-6 shrink-0 place-items-center border-2 ${multiple ? 'rounded-md' : 'rounded-full'} ${on ? 'border-bg bg-bg text-ink' : 'border-line'}`} aria-hidden="true">
                {on && <Icon name="check" className="h-4 w-4" strokeWidth={3} />}
              </span>
              <span className="flex flex-col leading-tight">
                {o.label}
                {o.hint && <span className={`mt-0.5 text-sm font-normal ${on ? 'opacity-75' : 'text-ink-3'}`}>{o.hint}</span>}
              </span>
            </label>
          )
        })}
      </div>
      <FieldError id={`${id}-err`}>{error}</FieldError>
    </fieldset>
  )
}

export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Уебсайт
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  )
}
