import type { ReactNode } from 'react'
import type { ProductArtKind } from '../../content/products'

/**
 * Vector product illustrations (no product photography yet). Neutral, brand-tinted, theme-aware.
 * Replace with real product photos via <Media> when available.
 */
const PAPER = '#f8f6f1'
const PAPER_SHADE = '#e2ddd3'
const PAPER_DARK = '#cfc8bb'
const CORE = '#b89a74'
const FILM = 'rgba(160, 205, 214, 0.55)'
const FILM_EDGE = 'rgba(90, 150, 165, 0.9)'

/** Upright cylinder (roll) with optional core hole */
function Roll({ cx, cy, rx, h, hole = 0.28, fill = PAPER, shade = PAPER_SHADE, core = CORE }: { cx: number; cy: number; rx: number; h: number; hole?: number; fill?: string; shade?: string; core?: string }) {
  const ry = rx * 0.32
  return (
    <g>
      <path d={`M${cx - rx} ${cy} v${h} a${rx} ${ry} 0 0 0 ${rx * 2} 0 v${-h}`} fill={shade} />
      <path d={`M${cx - rx} ${cy} v${h} a${rx} ${ry} 0 0 0 ${rx} ${ry} v${-h} a${rx} ${ry} 0 0 1 ${-rx} ${-ry}z`} fill={fill} opacity="0.55" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />
      {hole > 0 && <ellipse cx={cx} cy={cy} rx={rx * hole} ry={ry * hole} fill={core} />}
      {hole > 0 && <ellipse cx={cx} cy={cy + ry * hole * 0.25} rx={rx * hole * 0.72} ry={ry * hole * 0.6} fill="#000" opacity="0.25" />}
    </g>
  )
}

const scenes: Record<ProductArtKind, () => ReactNode> = {
  'toilet-paper': () => (
    <>
      <Roll cx={150} cy={170} rx={52} h={78} />
      <Roll cx={250} cy={170} rx={52} h={78} />
      <Roll cx={200} cy={95} rx={52} h={78} />
    </>
  ),
  'jumbo-roll': () => <Roll cx={200} cy={110} rx={105} h={95} hole={0.4} />,
  'kitchen-roll': () => (
    <>
      <Roll cx={160} cy={70} rx={48} h={170} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M112 ${105 + i * 30} a48 15.4 0 0 0 96 0`} fill="none" stroke={PAPER_DARK} strokeWidth="1.5" strokeDasharray="3 4" />
      ))}
      <Roll cx={265} cy={150} rx={42} h={90} />
    </>
  ),
  'hand-towels': () => (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`translate(0 ${-i * 16})`}>
          <path d="M110 230 L200 260 L290 230 L290 218 L200 248 L110 218 Z" fill={i % 2 ? PAPER_SHADE : PAPER} />
          <path d="M110 218 L200 248 L290 218" fill="none" stroke={PAPER_DARK} strokeWidth="1.2" />
        </g>
      ))}
      <path d="M110 138 L200 108 L290 138 L200 168 Z" fill={PAPER} />
      <path d="M200 108 L200 168" stroke={PAPER_DARK} strokeWidth="1.2" />
    </>
  ),
  napkins: () => (
    <>
      {[-14, -4, 6].map((r, i) => (
        <g key={i} transform={`rotate(${r} 200 160)`}>
          <rect x="125" y="85" width="150" height="150" rx="6" fill={i === 2 ? PAPER : PAPER_SHADE} />
          <path d="M125 85 L275 235" stroke={PAPER_DARK} strokeWidth="1.2" />
          <rect x="125" y="85" width="150" height="150" rx="6" fill="none" stroke={PAPER_DARK} strokeWidth="1" />
        </g>
      ))}
      <circle cx="200" cy="160" r="18" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.6" />
    </>
  ),
  'stretch-film': () => (
    <>
      <path d="M200 120 C 260 130, 300 170, 330 250 L 300 262 C 270 190, 235 160, 200 150 Z" fill={FILM} />
      <rect x="157" y="62" width="16" height="183" rx="3" fill={CORE} />
      <Roll cx={165} cy={80} rx={58} h={140} hole={0.22} fill="rgba(215,235,240,0.92)" shade="rgba(170,210,220,0.92)" />
      <rect x="157" y="62" width="16" height="18" rx="3" fill={CORE} />
      <path d="M107 80 v140" stroke="#fff" strokeOpacity="0.8" strokeWidth="6" />
    </>
  ),
  'pe-film': () => (
    <>
      <path d="M90 175 L310 175 L330 255 L110 255 Z" fill={FILM} stroke={FILM_EDGE} strokeWidth="1" />
      <g transform="rotate(-90 200 150)">
        <Roll cx={200} cy={45} rx={42} h={210} hole={0.3} fill="rgba(215,235,240,0.95)" shade="rgba(170,210,220,0.95)" />
      </g>
    </>
  ),
  'shrink-film': () => (
    <>
      <path d="M120 130 L200 100 L280 130 L280 225 L200 255 L120 225 Z" fill="#c9a47a" />
      <path d="M200 160 L280 130 L280 225 L200 255 Z" fill="#b28b62" />
      <path d="M120 130 L200 160 L280 130" fill="none" stroke="#9a7650" strokeWidth="1.5" />
      <path d="M112 128 L200 92 L288 128 L288 230 L200 264 L112 230 Z" fill={FILM} stroke={FILM_EDGE} strokeWidth="1.2" />
      <path d="M140 140 q20 -12 40 -4 M230 120 q18 4 30 18 M240 210 q14 -10 26 -6" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" fill="none" />
    </>
  ),
  'bubble-film': () => (
    <>
      <path d="M150 120 L330 120 L330 255 L150 255 Z" fill={FILM} stroke={FILM_EDGE} strokeWidth="1" />
      {Array.from({ length: 5 * 7 }, (_, i) => (
        <circle key={i} cx={165 + (i % 7) * 26} cy={137 + Math.floor(i / 7) * 26} r="9" fill="rgba(255,255,255,0.7)" stroke={FILM_EDGE} strokeWidth="1" />
      ))}
      <Roll cx={110} cy={95} rx={48} h={150} hole={0.25} fill="rgba(215,235,240,0.95)" shade="rgba(170,210,220,0.95)" />
    </>
  ),
  'construction-film': () => (
    <>
      <path d="M95 200 L200 165 L305 200 L200 235 Z" fill="#2f3337" />
      <path d="M95 200 L200 235 L200 255 L95 220 Z" fill="#23262a" />
      <path d="M200 235 L305 200 L305 220 L200 255 Z" fill="#1b1d20" />
      <path d="M130 188 L235 223 M165 176 L270 211" stroke="#4a4f55" strokeWidth="1.5" />
      <g transform="translate(0 -20)">
        <path d="M120 150 L200 122 L280 150 L200 178 Z" fill="#3a3f45" />
        <path d="M120 150 L200 178 L200 192 L120 164 Z" fill="#2a2e33" />
        <path d="M200 178 L280 150 L280 164 L200 192 Z" fill="#202327" />
      </g>
    </>
  ),
}

export function ProductArt({ kind, className = '', label }: { kind: ProductArtKind; className?: string; label?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-surface-2 to-surface-3 ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <div className="grid-lines absolute inset-0 opacity-40" aria-hidden="true" />
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
        <ellipse cx="200" cy="268" rx="150" ry="14" fill="#000" opacity="0.08" />
        {scenes[kind]()}
      </svg>
    </div>
  )
}
