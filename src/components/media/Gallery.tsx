import { useState } from 'react'
import type { ImageAsset } from '../../content/types'
import { Media } from './Media'
import { Lightbox } from './Lightbox'
import { Icon } from '../ui/Icon'

/** Horizontal swipe gallery on phones, bento grid on desktop; every image opens the fullscreen viewer. */
export function Gallery({ images, title }: { images: ImageAsset[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!images.length) return null
  return (
    <>
      <ul className="snap-row rail md:grid-cols-6 md:gap-3 md:overflow-visible md:px-0" aria-label={title}>
        {images.map((img, i) => (
          <li key={i} className={`w-[82vw] max-w-md md:w-auto md:max-w-none ${i % 5 === 0 ? 'md:col-span-4 md:row-span-2' : 'md:col-span-2'}`}>
            <button type="button" onClick={() => setOpen(i)} className="group relative block h-full w-full overflow-hidden rounded-2xl text-left" aria-label={`Отвори снимка ${i + 1}: ${img.alt}`}>
              <Media image={img} className={`h-full w-full transition-transform duration-700 group-hover:scale-[1.03] ${i % 5 === 0 ? 'aspect-[4/3] md:aspect-auto md:min-h-[28rem]' : 'aspect-[4/3]'}`} sizes="(min-width: 768px) 50vw, 82vw" />
              <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white opacity-90 backdrop-blur-sm transition group-hover:scale-110" aria-hidden="true">
                <Icon name="zoomIn" className="h-5 w-5" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  )
}
