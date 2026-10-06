// Turns original photos into responsive AVIF + WebP sets for <Media>.
//
//   content-images/projects/marica-park/hero.jpg
//     → public/images/projects/marica-park/hero-{480,800,1200,1800}.{avif,webp}
//
// Then reference it in content:  cover: { src: 'images/projects/marica-park/hero', alt: '…' }
// Originals stay out of git (see .gitignore); only optimised outputs are committed.
// Run: npm run images                      (everything in content-images/)
//      npm run images -- projects/new-obekt   (only these sub-folders)
import sharp from 'sharp'
import { readdirSync, statSync, mkdirSync, existsSync } from 'node:fs'
import { join, relative, dirname, extname, basename } from 'node:path'

const SRC = 'content-images'
const OUT = 'public/images'
const WIDTHS = [480, 800, 1200, 1600] // source photos are ≤ 1600 px

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
if (!existsSync(SRC)) {
  console.log(`No ${SRC}/ folder — nothing to optimise.`)
  process.exit(0)
}
const only = process.argv.slice(2)
const roots = only.length ? only.map((d) => join(SRC, d)) : [SRC]
for (const file of roots.flatMap(walk).filter((f) => /\.(jpe?g|png|tiff?|webp|heic)$/i.test(f))) {
  const rel = relative(SRC, dirname(file))
  const name = basename(file, extname(file)).toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  mkdirSync(join(OUT, rel), { recursive: true })
  const img = sharp(file).rotate() // respect EXIF orientation, strips metadata (incl. GPS) on output
  const { width = 0 } = await img.metadata()
  for (const w of WIDTHS) {
    const target = Math.min(w, width)
    const base = join(OUT, rel, `${name}-${w}`)
    await img.clone().resize({ width: target, withoutEnlargement: true }).avif({ quality: 52, effort: 4 }).toFile(`${base}.avif`)
    await img.clone().resize({ width: target, withoutEnlargement: true }).webp({ quality: 74 }).toFile(`${base}.webp`)
  }
  console.log(`✓ ${file} → images/${rel}/${name}`)
}
