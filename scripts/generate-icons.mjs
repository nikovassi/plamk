// Generates favicon, PWA icons, apple-touch-icon and the Open Graph image from the PLAMK logo paths.
// Run: npm run icons
import sharp from 'sharp'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const src = readFileSync('src/components/layout/logoPaths.ts', 'utf8')
const WORD = JSON.parse(src.match(/PLAMK_PATH = (".*")/)[1])
const P = JSON.parse(src.match(/PLAMK_P_PATH = (".*")/)[1])
const BG = '#141517'
const FG = '#f4f2ee'
const ACCENT = '#4cc2b8'

// P glyph bounds in logo coordinates: x 114–440, y 175–507 → square tile with padding
const tile = (pad) => {
  const size = 332 + pad * 2
  const x = 277 - size / 2 // P centre x (114 + 326/2)
  const y = 341 - size / 2 // P centre y (175 + 332/2)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${size} ${size}">
  <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${BG}"/>
  <path fill="${FG}" fill-rule="evenodd" d="${P}"/>
  <rect x="${114}" y="${507 + pad * 0.35}" width="326" height="${Math.max(10, pad * 0.12)}" fill="${ACCENT}"/>
</svg>`
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/favicon.svg', tile(70).replace(/\n\s*/g, ''))
const png = (svg, size, file) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(file)
await png(tile(80), 192, 'public/icons/icon-192.png')
await png(tile(80), 512, 'public/icons/icon-512.png')
await png(tile(200), 512, 'public/icons/icon-maskable-512.png') // safe zone for maskable
await png(tile(90), 180, 'public/apple-touch-icon.png')

// Open Graph 1200×630
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${BG}"/>
  <svg x="72" y="150" width="720" height="135" viewBox="114 175 1775 332"><path fill="${FG}" fill-rule="evenodd" d="${WORD}"/></svg>
  <rect x="72" y="320" width="120" height="6" fill="${ACCENT}"/>
  <text x="72" y="400" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="${FG}">Фасади и търговия</text>
  <text x="72" y="460" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${ACCENT}">Фасади • Метал • Трудова медицина • Хартия • Фолиа</text>
  <text x="72" y="540" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#b7b4ae">ПЛАМК ЕООД · гр. Казанлък</text>
</svg>`
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile('public/og-image.png')
console.log('icons + og-image generated')
