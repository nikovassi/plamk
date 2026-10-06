import sharp from 'sharp'
const [,, file, h = '1300'] = process.argv
const img = sharp(file); const { width, height } = await img.metadata()
const H = +h; const n = Math.ceil(height / H); const out = []
for (let i = 0; i < n; i++) { const f = file.replace('.png', `-t${i}.png`); await sharp(file).extract({ left: 0, top: i * H, width, height: Math.min(H, height - i * H) }).toFile(f); out.push(f) }
console.log(out.join('\n'))
