import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import type { StoredDraft } from '../../lib/lead/draft'

export function DraftPrompt({ draft, onResume, onRestart }: { draft: StoredDraft; onResume: () => void; onRestart: () => void }) {
  const when = new Date(draft.updatedAt).toLocaleString('bg-BG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-lg flex-col justify-center px-4 py-24" data-testid="draft-prompt">
      <div className="rounded-[28px] border border-line bg-surface p-6 shadow-card anim-pop md:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent"><Icon name="clock" /></span>
        <h1 className="mt-5 text-3xl">Имате незавършено запитване.</h1>
        <p className="mt-2 text-ink-2">Последна промяна: {when}. Данните са запазени само на това устройство.</p>
        <div className="mt-6 grid gap-3">
          <Button size="lg" icon="arrow" onClick={onResume}>Продължи</Button>
          <Button size="lg" variant="ghost" onClick={onRestart}>Започни отначало</Button>
        </div>
      </div>
    </div>
  )
}
