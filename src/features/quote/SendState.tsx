import { Button } from '../../components/ui/Button'
import { ContactActions } from '../../components/sections/ContactActions'
import type { SubmitError } from '../../lib/lead/submit'

export function SendProgress({ value, hasFiles }: { value: number; hasFiles: boolean }) {
  const pct = Math.round(value * 100)
  return (
    <div className="w-full" role="status" aria-live="polite">
      <div className="mb-2 flex justify-between text-[0.9375rem] font-semibold">
        <span>{hasFiles ? (pct < 100 ? 'Качване на файловете…' : 'Обработка…') : 'Изпращане…'}</span>
        {hasFiles && <span className="tnum">{pct}%</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Изпращане">
        <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${hasFiles ? Math.max(pct, 3) : 60}%` }} />
      </div>
    </div>
  )
}

export function SendError({ error, onRetry }: { error: SubmitError; onRetry: () => void }) {
  return (
    <div className="mt-6 rounded-[22px] border border-danger/40 bg-danger/5 p-5" role="alert" data-testid="send-error">
      <p className="font-semibold text-danger">Запитването не е изпратено</p>
      <p className="mt-1 text-ink-2">{error.message}</p>
      {error.code === 'offline' && <p className="mt-1 text-sm text-ink-3">Ще опитаме автоматично, когато връзката се възстанови.</p>}
      {error.code !== 'not-configured' ? (
        <Button variant="secondary" className="mt-4" iconLeft="refresh" onClick={onRetry}>Опитай отново</Button>
      ) : (
        <div className="mt-4"><ContactActions from="send-error" /></div>
      )}
    </div>
  )
}
