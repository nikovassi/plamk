import { useEffect, useMemo, useRef, useState } from 'react'
import { ACCEPT_ATTR, ACCEPT_IMAGES, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, addFiles, formatBytes, type Attachment } from '../../lib/lead/files'
import { Icon } from '../../components/ui/Icon'
import { track } from '../../lib/analytics'

function Thumb({ a }: { a: Attachment }) {
  const url = useMemo(() => (a.kind === 'jpg' || a.kind === 'png' ? URL.createObjectURL(a.file) : null), [a])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  if (url) return <img src={url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
  return <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-2 text-xs font-bold uppercase text-ink-2">{a.kind}</span>
}

/**
 * Multi-file picker. Phones: Camera / Photo library / Files buttons. Desktop: drag & drop zone.
 * Every file is validated (type, MIME, magic bytes, size, count) before it is accepted.
 */
export function FileUpload({ files, onChange, compact }: { files: Attachment[]; onChange: (f: Attachment[]) => void; compact?: boolean }) {
  const [errors, setErrors] = useState<string[]>([])
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const camRef = useRef<HTMLInputElement>(null)
  const galRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const total = files.reduce((s, a) => s + a.file.size, 0)

  const accept = async (list: FileList | File[] | null) => {
    if (!list || !list.length) return
    setBusy(true)
    const res = await addFiles(files, Array.from(list))
    setBusy(false)
    setErrors(res.errors)
    if (res.added.length) {
      onChange([...files, ...res.added])
      track('file_upload', { count: res.added.length })
    }
  }
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    void accept(e.target.files)
    e.target.value = ''
  }
  const btn = 'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface px-2 py-3 text-[0.9375rem] font-semibold transition active:scale-[0.97] hover:border-ink-3'

  return (
    <div>
      <input ref={camRef} type="file" accept={ACCEPT_IMAGES} capture="environment" className="sr-only" tabIndex={-1} onChange={onInput} aria-label="Снимка с камерата" data-testid="file-camera" />
      <input ref={galRef} type="file" accept={ACCEPT_IMAGES} multiple className="sr-only" tabIndex={-1} onChange={onInput} aria-label="Снимки от галерията" />
      <input ref={fileRef} type="file" accept={ACCEPT_ATTR} multiple className="sr-only" tabIndex={-1} onChange={onInput} aria-label="Файлове (PDF, JPG, PNG, DWG)" data-testid="file-input" />

      {/* Phones / tablets */}
      <div className="grid grid-cols-3 gap-2 pointer-fine:hidden">
        <button type="button" className={btn} onClick={() => camRef.current?.click()}><Icon name="camera" className="h-6 w-6" />Камера</button>
        <button type="button" className={btn} onClick={() => galRef.current?.click()}><Icon name="image" className="h-6 w-6" />Галерия</button>
        <button type="button" className={btn} onClick={() => fileRef.current?.click()}><Icon name="file" className="h-6 w-6" />Файлове</button>
      </div>

      {/* Desktop: drag & drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void accept(e.dataTransfer.files) }}
        className={`hidden flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 text-center transition-colors pointer-fine:flex ${compact ? 'py-6' : 'py-10'} ${drag ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}
      >
        <Icon name="upload" className="h-8 w-8 text-ink-3" />
        <p className="text-lg font-semibold">Пуснете файловете тук</p>
        <p className="text-ink-3">или</p>
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-12 items-center rounded-full bg-ink px-5 font-semibold text-bg">Изберете файлове</button>
      </div>

      <p className="mt-3 text-sm text-ink-3">
        PDF, JPG, PNG, DWG · до {formatBytes(MAX_FILE_BYTES)} на файл · до {MAX_FILES} файла · общо до {formatBytes(MAX_TOTAL_BYTES)}
      </p>

      {busy && <p className="mt-3 text-sm text-ink-2" role="status">Проверка на файловете…</p>}
      {errors.length > 0 && (
        <ul className="mt-3 grid gap-2" role="alert" data-testid="file-errors">
          {errors.map((e) => <li key={e} className="rounded-xl bg-danger/10 px-3 py-2 text-[0.9375rem] font-medium text-danger">{e}</li>)}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="mt-4 grid gap-2" aria-label="Прикачени файлове" data-testid="file-list">
          {files.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2 pr-1 anim-pop">
              <Thumb a={a} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{a.file.name}</span>
                <span className="block text-sm text-ink-3">{formatBytes(a.file.size)}</span>
              </span>
              <button type="button" onClick={() => onChange(files.filter((x) => x.id !== a.id))} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-surface-2" aria-label={`Премахни ${a.file.name}`}>
                <Icon name="trash" className="h-5 w-5" />
              </button>
            </li>
          ))}
          <li className="text-right text-sm text-ink-3 tnum">{files.length}/{MAX_FILES} · {formatBytes(total)}</li>
        </ul>
      )}
    </div>
  )
}
