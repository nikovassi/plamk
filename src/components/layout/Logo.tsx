import { site } from '../../content/site'

/** Working wordmark — replace with the company logo (keep it an inline SVG for crisp rendering). */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="7" fill="currentColor" />
        <path d="M8 8h7v7H8zM17 8h7v4h-7zM17 14h7v10h-7zM8 17h7v7H8z" fill="var(--bg)" />
        <path d="M17 14h7v3h-7z" fill="var(--accent)" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[1.05rem] font-bold tracking-[0.18em]">{site.brand}</span>
        <span className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-[0.22em] opacity-70">{site.brandTagline}</span>
      </span>
    </span>
  )
}
