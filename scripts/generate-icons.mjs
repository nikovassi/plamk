// Generates PWA icons, apple-touch-icon and the Open Graph image from inline SVG.
// Run: npm run icons   (re-run after replacing the logo)
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })
const mark = (pad = 0) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${32 + pad * 2} ${32 + pad * 2}">
  <rect x="${-pad}" y="${-pad}" width="${32 + pad * 2}" height="${32 + pad * 2}" fill="#141517"/>
  <path d="M8 8h7v7H8zM17 8h7v4h-7zM17 14h7v10h-7zM8 17h7v7H8z" fill="#f4f2ee"/>
  <path d="M17 14h7v3h-7z" fill="#4cc2b8"/>
</svg>`
const png = (svg, size, file) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(file)

await png(mark(2), 192, 'public/icons/icon-192.png')
await png(mark(2), 512, 'public/icons/icon-512.png')
await png(mark(10), 512, 'public/icons/icon-maskable-512.png') // safe zone for maskable
await png(mark(3), 180, 'public/apple-touch-icon.png')

// Open Graph 1200×630: panel grid + wordmark
let cells = ''
for (let r = 0; r < 7; r++)
  for (let c = 0; c < 12; c++) {
    const l = 38 + ((r * 7 + c * 13) % 9) * 2
    cells += `<rect x="${600 + c * 52}" y="${r * 92}" width="49" height="89" fill="hsl(210 4% ${l}%)"/>`
  }
const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#141517"/>
  <g transform="skewY(-8) translate(0 90)">${cells}</g>
  <rect width="1200" height="630" fill="url(#g)"/>
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0.35" stop-color="#141517"/><stop offset="1" stop-color="#141517" stop-opacity="0.2"/></linearGradient></defs>
  <text x="72" y="250" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="700" fill="#f4f2ee" letter-spacing="-2">Фасади и търговия</text>
  <text x="72" y="330" font-family="Arial, Helvetica, sans-serif" font-size="38" fill="#4cc2b8">Фасади • Метал • Хартия • Фолиа</text>
  <text x="72" y="400" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#b7b4ae">Фасадни облицовки, метални конструкции, хартиени продукти и фолиа</text>
  <text x="72" y="560" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#f4f2ee" letter-spacing="6">ПЛАМК</text>
</svg>`
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile('public/og-image.png')
console.log('icons + og-image generated')
