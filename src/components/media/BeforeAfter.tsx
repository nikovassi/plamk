import { useId, useRef, useState } from 'react'
import type { ImageAsset } from '../../content/types'
import { Media } from './Media'

/** Draggable before/after comparison. Keyboard accessible through a native range input. */
export function BeforeAfter({ before, after }: { before: ImageAsset; after: ImageAsset }) {
  const [pos, setPos] = useState(50)
  const box = useRef<HTMLDivElement>(null)
  const id = useId()
  const fromPointer = (clientX: number) => {
    const r = box.current?.getBoundingClientRect()
    if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }
  return (
    <div
      ref={box}
      className="relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden rounded-3xl md:aspect-[16/9]"
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); fromPointer(e.clientX) }}
      onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') fromPointer(e.clientX) }}
    >
      <Media image={after} className="absolute inset-0 h-full w-full" label={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Media image={before} className="absolute inset-0 h-full w-full" label={false} />
      </div>
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">Преди</span>
      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">След</span>
      {(before.tone || after.tone) && !before.src && (
        <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white">Placeholder · снимки преди / след</span>
      )}
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.2)]" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#141517] shadow-lg">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 6-6 6 6 6M15 6l6 6-6 6" /></svg>
        </div>
      </div>
      <label htmlFor={id} className="sr-only">Сравнение преди и след — плъзнете</label>
      <input id={id} type="range" min={0} max={100} value={Math.round(pos)} onChange={(e) => setPos(Number(e.target.value))} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  )
}
