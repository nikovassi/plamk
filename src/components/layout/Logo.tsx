import { site } from '../../content/site'
import { PLAMK_PATH, PLAMK_VIEWBOX } from './logoPaths'

/** PLAMK wordmark. Uses currentColor, so it is dark in light mode, light in dark mode and white over photos. */
export function Logo({ className = '', tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <span className={`inline-flex flex-col items-start leading-none ${className}`}>
      <svg viewBox={PLAMK_VIEWBOX} className="h-[22px] w-auto lg:h-6" role="img" aria-label={site.brand} focusable="false">
        <path fill="currentColor" fillRule="evenodd" d={PLAMK_PATH} />
      </svg>
      {tagline && (
        <span className="mt-1.5 whitespace-nowrap text-[0.625rem] font-medium uppercase tracking-[0.22em] opacity-70 lg:max-xl:hidden">{site.brandTagline}</span>
      )}
    </span>
  )
}
