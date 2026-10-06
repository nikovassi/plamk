import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ImageAsset } from '../../content/types'
import { Media } from './Media'
import { Icon } from '../ui/Icon'

/**
 * Native-like fullscreen viewer: swipe left/right, swipe down to close, pinch / double-tap / button zoom,
 * pan while zoomed, arrow keys + Esc, focus trap.
 */
export function Lightbox({ images, index, onClose, onIndex }: { images: ImageAsset[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const start = useRef<{ x: number; y: number; dist: number; zoom: number; pan: { x: number; y: number } } | null>(null)
  const lastTap = useRef(0)
  const root = useRef<HTMLDivElement>(null)
  const n = images.length

  const go = useCallback((d: number) => { setZoom(1); setPan({ x: 0, y: 0 }); onIndex((index + d + n) % n) }, [index, n, onIndex])

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const html = document.documentElement
    const o = html.style.overflow
    html.style.overflow = 'hidden'
    root.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); html.style.overflow = o; prevFocus?.focus?.() }
  }, [go, onClose])

  const dist = () => {
    const [a, b] = [...pointers.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  const onDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    start.current = { x: e.clientX, y: e.clientY, dist: dist(), zoom, pan }
    const now = Date.now()
    if (pointers.current.size === 1 && now - lastTap.current < 280) {
      setZoom((z) => (z > 1 ? 1 : 2.5))
      setPan({ x: 0, y: 0 })
    }
    lastTap.current = now
  }
  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !start.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const s = start.current
    if (pointers.current.size === 2 && s.dist > 0) {
      setZoom(Math.min(4, Math.max(1, s.zoom * (dist() / s.dist))))
      return
    }
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (zoom > 1) setPan({ x: s.pan.x + dx, y: s.pan.y + dy })
    else setDrag({ x: dx, y: Math.max(0, dy) })
  }
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size > 0) return
    if (zoom === 1) {
      if (drag.y > 120) onClose()
      else if (drag.x < -60) go(1)
      else if (drag.x > 60) go(-1)
    } else if (zoom < 1.05) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
    setDrag({ x: 0, y: 0 })
    start.current = null
  }

  const img = images[index]
  const fade = 1 - Math.min(0.6, drag.y / 400)
  return createPortal(
    <div
      ref={root}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Галерия, снимка ${index + 1} от ${n}`}
      className="fixed inset-0 z-[80] flex flex-col bg-black text-white outline-none anim-fade"
      style={{ backgroundColor: `rgb(0 0 0 / ${fade})` }}
    >
      <div className="flex items-center justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="tnum px-2 text-sm text-white/80" aria-live="polite">{index + 1} / {n}</span>
        <div className="flex gap-1">
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10" aria-label={zoom > 1 ? 'Намали' : 'Увеличи'} onClick={() => { setZoom(zoom > 1 ? 1 : 2.5); setPan({ x: 0, y: 0 }) }}>
            <Icon name="zoomIn" />
          </button>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10" aria-label="Затвори галерията" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
      </div>
      <div
        className="relative flex-1 touch-none overflow-hidden"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div
          className="absolute inset-0 flex items-center justify-center p-2 transition-transform duration-150 md:p-12"
          style={{ transform: `translate3d(${pan.x + drag.x}px, ${pan.y + drag.y}px, 0) scale(${zoom})`, transitionDuration: pointers.current.size ? '0ms' : '200ms' }}
        >
          <Media key={index} image={img} className="aspect-[3/2] max-h-full w-full max-w-6xl rounded-lg anim-fade" sizes="100vw" priority />
        </div>
      </div>
      {img.caption || img.alt ? <p className="px-4 pb-2 text-center text-sm text-white/75">{img.caption ?? img.alt}</p> : null}
      {n > 1 && (
        <div className="flex items-center justify-center gap-3 p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Предишна снимка" onClick={() => go(-1)}>
            <Icon name="chevronLeft" />
          </button>
          <button type="button" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Следваща снимка" onClick={() => go(1)}>
            <Icon name="chevronRight" />
          </button>
        </div>
      )}
    </div>,
    document.body,
  )
}
