import { useEffect, useState } from 'react'
import type { ImageAsset, VideoAsset } from '../../content/types'
import { Media } from './Media'
import { asset } from '../../lib/paths'

/**
 * Hero visual. A video is only attached on wide screens, without Save-Data and without
 * reduced motion — phones on mobile data get the poster image only.
 */
export function HeroMedia({ image, video }: { image: ImageAsset; video: VideoAsset | null }) {
  const [playVideo, setPlayVideo] = useState(false)
  useEffect(() => {
    if (!video) return
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const slow = conn?.saveData || /2g|3g/.test(conn?.effectiveType ?? '')
    const ok = matchMedia('(min-width: 1024px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches && !slow
    setPlayVideo(ok)
  }, [video])
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Media image={video?.poster ?? image} priority className="absolute inset-0 h-full w-full anim-kenburns" sizes="100vw" label="Placeholder · снимка на реална фасада" labelClassName="right-3 top-[calc(4.75rem+env(safe-area-inset-top))] lg:top-24" />
      {video && playVideo && (
        <video className="absolute inset-0 h-full w-full object-cover" src={asset(video.src)} poster={video.poster.src ? asset(`${video.poster.src}-1800.webp`) : undefined} autoPlay muted loop playsInline preload="none" aria-hidden="true" />
      )}
    </div>
  )
}
