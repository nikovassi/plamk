/** Visual tone of the generated placeholder (material look). */
export type ArtTone = 'acp-silver' | 'acp-graphite' | 'acp-bronze' | 'hpl-wood' | 'hpl-dark' | 'ceramic-stone' | 'ceramic-light' | 'ceramic-slab' | 'mixed' | 'old-plaster'

/**
 * Procedural facade illustration, used ONLY as a clearly-labelled placeholder until real
 * photography is supplied. Draws a building corner in two-point (affine) perspective with a
 * panel pattern characteristic of each material. Pure + deterministic → emitted as static
 * .svg files at build time (see scripts/prerender.ts) and loaded lazily like real photos.
 */

interface Palette {
  panels: string[]
  joint: string
  pattern: 'cassette' | 'plank' | 'tile' | 'slab' | 'plaster'
  cols: number
  rows: number
}

const P: Record<Exclude<ArtTone, 'mixed'>, Palette> = {
  'acp-silver': { panels: ['#c7cacf', '#bdc1c6', '#d1d4d8', '#c2c6cb'], joint: '#7f858c', pattern: 'cassette', cols: 7, rows: 9 },
  'acp-graphite': { panels: ['#3c4045', '#44484e', '#363a3f', '#404449'], joint: '#1b1d20', pattern: 'cassette', cols: 6, rows: 9 },
  'acp-bronze': { panels: ['#8a6b50', '#7e6049', '#97775b', '#846650'], joint: '#40301f', pattern: 'cassette', cols: 6, rows: 8 },
  'hpl-wood': { panels: ['#a5714a', '#b17e56', '#96653f', '#bb8a61', '#9e6c47'], joint: '#4f331f', pattern: 'plank', cols: 18, rows: 4 },
  'hpl-dark': { panels: ['#2e3135', '#34373b', '#2a2c30'], joint: '#141517', pattern: 'plank', cols: 10, rows: 6 },
  'ceramic-stone': { panels: ['#b8b1a5', '#c2bbaf', '#ada699', '#bcb5a9'], joint: '#857f75', pattern: 'tile', cols: 8, rows: 14 },
  'ceramic-light': { panels: ['#e1dcd3', '#d7d2c9', '#eae6de', '#dcd7ce'], joint: '#aea89e', pattern: 'tile', cols: 8, rows: 14 },
  'ceramic-slab': { panels: ['#d8d5cf', '#cecbc5', '#d3d0ca'], joint: '#9f9b95', pattern: 'slab', cols: 4, rows: 5 },
  'old-plaster': { panels: ['#c7b89f', '#bdad92', '#cdbfa7'], joint: '#a3937a', pattern: 'plaster', cols: 6, rows: 8 },
}

export const ART_TONES = [...Object.keys(P), 'mixed'] as ArtTone[]

function rng(seed: number) {
  let a = seed * 2654435761
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const W = 1600
const H = 1000
const n = (x: number) => Math.round(x * 10) / 10
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" fill="${fill}"${extra}/>`

function face(pal: Palette, width: number, height: number, rand: () => number, shrink: number, farAtStart: boolean, windowEvery: number) {
  const out: string[] = [rect(0, 0, width, height, pal.joint)]
  const raw = Array.from({ length: pal.cols }, (_, i) => Math.pow(shrink, i))
  const sum = raw.reduce((s, x) => s + x, 0)
  let widths = raw.map((x) => (x / sum) * width)
  if (farAtStart) widths = widths.reverse()
  const xs = [0]
  widths.forEach((w) => xs.push(xs[xs.length - 1] + w))
  const rowH = height / pal.rows
  const jw = pal.pattern === 'slab' ? 2 : pal.pattern === 'plaster' ? 0 : 3
  const pick = () => pal.panels[Math.floor(rand() * pal.panels.length)]

  for (let r = 0; r < pal.rows; r++) {
    const y = r * rowH
    const isWindow = pal.pattern !== 'plank' && windowEvery > 0 && r % windowEvery === windowEvery - 1
    for (let c = 0; c < pal.cols; c++) {
      const x = xs[c]
      const w = widths[c]
      if (isWindow) {
        out.push(rect(x, y, w, rowH * 0.92, 'url(#glass)'), rect(x, y, 4, rowH * 0.92, pal.joint))
      } else if (pal.pattern === 'tile') {
        const off = r % 2 ? w / 2 : 0
        if (off) out.push(rect(x, y, off - jw, rowH - jw, pick()), rect(x + off, y, w - off - jw, rowH - jw, pick()))
        else out.push(rect(x, y, w - jw, rowH - jw, pick()))
      } else if (pal.pattern === 'plaster') {
        out.push(rect(x, y, w + 1, rowH + 1, pick()))
        if (r % 2 === 1) out.push(rect(x + w * 0.28, y + rowH * 0.12, w * 0.44, rowH * 0.7, '#3a3f45', ' stroke="#e8e1d2" stroke-width="6"'))
      } else {
        out.push(rect(x, y, w - jw, rowH - jw, pick()))
        if (pal.pattern === 'plank' && rand() > 0.6) out.push(rect(x + w * 0.3, y, w * 0.12, rowH - jw, '#000', ' opacity=".05"'))
      }
    }
  }
  if (pal.pattern === 'plaster') {
    for (let i = 0; i < 9; i++)
      out.push(`<ellipse cx="${n(rand() * width)}" cy="${n(rand() * height)}" rx="${n(60 + rand() * 160)}" ry="${n(30 + rand() * 120)}" fill="#5b4b33" opacity="${n(0.08 + rand() * 0.08)}"/>`)
    for (let i = 0; i < 4; i++)
      out.push(`<path d="M${n(rand() * width)} ${n(rand() * height)}l${n(20 + rand() * 30)} ${n(40 + rand() * 30)}l${n(-10 + rand() * 20)} ${n(30 + rand() * 40)}" stroke="#6b5a40" stroke-width="2" fill="none" opacity=".5"/>`)
  }
  return out.join('')
}

export function facadeSvg(tone: ArtTone = 'acp-silver', seed = 1): string {
  const rand = rng(seed + tone.length * 97)
  const left = tone === 'mixed' ? P['acp-graphite'] : P[tone]
  const right = tone === 'mixed' ? P['hpl-wood'] : P[tone]
  const cx = W * (0.36 + rand() * 0.26)
  const yC = H * (0.06 + rand() * 0.14)
  const k = 0.1 + rand() * 0.14
  const faceH = H * 1.6
  const dusk = rand() > 0.62
  const windowEvery = left.pattern === 'slab' ? 0 : 2 + Math.floor(rand() * 2)
  const rw = W - cx

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>
<linearGradient id="sky" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${dusk ? '#c9b8a6' : '#c9d2da'}"/><stop offset="1" stop-color="${dusk ? '#efe2d2' : '#eef1f3'}"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5d6b78"/><stop offset=".45" stop-color="#2a333c"/><stop offset=".55" stop-color="#3b4752"/><stop offset="1" stop-color="#1c2228"/></linearGradient>
<linearGradient id="ls" x1="0" x2="1"><stop offset="0" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
<linearGradient id="rs" x1="0" x2="1"><stop offset="0" stop-opacity=".32"/><stop offset="1" stop-opacity=".12"/></linearGradient>
<linearGradient id="vs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".7" stop-opacity="0"/><stop offset="1" stop-opacity=".25"/></linearGradient>
<radialGradient id="sun" cx="${dusk ? '.15' : '.85'}" cy=".05" r=".7"><stop offset="0" stop-color="${dusk ? '#ffd9b0' : '#fff'}" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs><rect width="${W}" height="${H}" fill="url(#sky)"/>
<g transform="matrix(1 ${n(-k * 1000) / 1000} 0 1 0 ${n(yC + cx * k)})">${face(left, cx, faceH, rand, 0.9, true, windowEvery)}${rect(0, 0, cx, faceH, 'url(#ls)')}${rect(0, 0, cx, faceH, 'url(#vs)')}</g>
<g transform="matrix(1 ${n(k * 800) / 1000} 0 1 ${n(cx)} ${n(yC)})">${face(right, rw, faceH, rand, 0.86, false, windowEvery)}${rect(0, 0, rw, faceH, 'url(#rs)')}${rect(0, 0, rw, faceH, 'url(#vs)')}</g>
<path d="M0 ${n(yC + cx * k)}L${n(cx)} ${n(yC)}L${W} ${n(yC + rw * k * 0.8)}" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none"/>
<path d="M${n(cx)} ${n(yC)}V${H}" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
<rect width="${W}" height="${H}" fill="url(#sun)"/></svg>`
}

export const placeholderPath = (tone: ArtTone = 'acp-silver', seed = 1) => `placeholders/${tone}-${seed}.svg`
export const PLACEHOLDER_RE = /placeholders\/([a-z-]+?)-(\d+)\.svg/g
