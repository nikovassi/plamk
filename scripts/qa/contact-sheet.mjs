// Contact sheet of photos with short labels (for classifying source images)
import sharp from 'sharp'
import { readdirSync } from 'node:fs'
const [,, dir, out, per = '24', cols = '6'] = process.argv
const files = readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort()
const W = 260, H = 200, C = +cols, P = +per
for (let s = 0; s * P < files.length; s++) {
  const batch = files.slice(s * P, s * P + P)
  const rows = Math.ceil(batch.length / C)
  const tiles = await Promise.all(batch.map(async (f, i) => {
    const img = await sharp(`${dir}/${f}`).rotate().resize(W, H - 22, { fit: 'cover' }).toBuffer()
    const label = Buffer.from(`<svg width="${W}" height="22"><rect width="${W}" height="22" fill="#000"/><text x="6" y="16" font-size="15" font-family="monospace" fill="#fff">${f.slice(4, 10)}</text></svg>`)
    return [{ input: img, left: (i % C) * W, top: Math.floor(i / C) * H }, { input: label, left: (i % C) * W, top: Math.floor(i / C) * H + H - 22 }]
  }))
  await sharp({ create: { width: C * W, height: rows * H, channels: 3, background: '#222' } }).composite(tiles.flat()).jpeg({ quality: 80 }).toFile(`${out}-${s}.jpg`)
  console.log(`${out}-${s}.jpg`)
}
