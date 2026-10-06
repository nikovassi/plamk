import { Link } from 'react-router'
import type { Service } from '../../content/types'
import { Media } from '../media/Media'
import { Icon } from '../ui/Icon'

export function ServiceCard({ s, index, tall }: { s: Service; index?: number; /** keep portrait proportions in narrow (5-col) grids */ tall?: boolean }) {
  return (
    <Link to={`/uslugi/${s.slug}`} className="group relative block h-full overflow-hidden rounded-[24px] bg-[#141517] text-white">
      <div className={`relative aspect-[3/4] sm:aspect-[4/5] ${tall ? '' : 'lg:aspect-[5/4]'}`}>
        <Media image={s.cover} className="absolute inset-0 h-full w-full opacity-90 transition-transform duration-[1.2s] group-hover:scale-[1.05]" sizes="(min-width: 1024px) 25vw, 70vw" label={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        {index !== undefined && <span className="tnum absolute left-5 top-5 text-sm font-semibold text-white/70">{String(index + 1).padStart(2, '0')}</span>}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-2xl">{s.name}</h3>
          <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-snug text-white/75">{s.shortDescription}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-[0.9375rem] font-semibold">
            Научи повече <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  )
}
