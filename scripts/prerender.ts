import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import zlib from 'node:zlib'
import type { Plugin } from 'vite'
import { facadeSvg, PLACEHOLDER_RE, type ArtTone } from '../src/lib/facadeSvg.ts'

/**
 * Static site generation. Runs in the client build's writeBundle (before vite-plugin-pwa
 * builds the service worker in closeBundle), so the precache contains the real pages.
 *
 * For every route writes both `route.html` and `route/index.html` — GitHub Pages serves
 * clean URLs either way without a redirect. Also writes 404.html, sitemap.xml and robots.txt.
 */
export function prerender({ ssrEntry, siteUrl }: { ssrEntry: string; siteUrl: string }): Plugin {
  let base0 = '/'
  return {
    configResolved(c) {
      base0 = c.base
    },
    name: 'facade:prerender',
    apply: 'build',
    writeBundle: {
      sequential: true,
      order: 'post',
      async handler(options, bundle) {
        const out = options.dir!
        const entry = path.resolve(ssrEntry)
        if (!fs.existsSync(entry)) {
          this.warn(`SSR bundle not found at ${entry} — skipping prerender (run the SSR build first).`)
          return
        }
        const mod = await import(pathToFileURL(entry).href)
        let template = fs.readFileSync(path.join(out, 'index.html'), 'utf8')

        // 1) Inline the (single, ~12 KB gzip) stylesheet: removes a render-blocking round trip on first visit
        template = template.replace(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g, (tag, href: string) => {
          const file = path.join(out, href.slice(base0.length))
          return fs.existsSync(file) ? `<style>${fs.readFileSync(file, 'utf8')}</style>` : tag
        })
        // 2) Preload the two font subsets used by Bulgarian text, so text doesn't repaint late (LCP)
        const fonts = Object.keys(bundle).filter((f) => /inter-tight-(cyrillic|latin)-wght-normal.*\.woff2$/.test(f))
        template = template.replace(
          '<!--app-head-->',
          `<!--app-head-->\n    ${fonts.map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="${base0}${f}">`).join('\n    ')}`,
        )
        // source module → its client chunk + static imports (for modulepreload)
        const chunks = Object.values(bundle).filter((c) => c.type === 'chunk')
        const preloadFor = (src: string) => {
          const chunk = chunks.find((c) => c.facadeModuleId?.endsWith(src))
          if (!chunk) return []
          const seen = new Set<string>()
          const walk = (file: string) => {
            if (seen.has(file)) return
            seen.add(file)
            const c = chunks.find((x) => x.fileName === file)
            c?.imports.forEach(walk)
          }
          walk(chunk.fileName)
          return [...seen]
        }
        const already = new Set([...template.matchAll(/assets\/[^"]+\.js/g)].map((m) => m[0]))
        const page = async (url: string) => {
          const { html, head } = await mod.render(url)
          const files = (mod.routeModules(url) as string[]).flatMap(preloadFor).filter((f) => !already.has(f))
          const links = [...new Set(files)].map((f) => `<link rel="modulepreload" crossorigin href="${base0}${f}">`).join('\n    ')
          return template.replace('<!--app-head-->', `${head}\n    ${links}`).replace('<!--app-html-->', html)
        }
        const routes: string[] = mod.routes()
        const placeholders = new Set<string>()
        const collect = (html: string) => { for (const m of html.matchAll(PLACEHOLDER_RE)) placeholders.add(`${m[1]}|${m[2]}`) }
        for (const r of routes) {
          const html = await page(r)
          collect(html)
          if (r === '/') {
            fs.writeFileSync(path.join(out, 'index.html'), html)
            continue
          }
          const rel = r.replace(/^\//, '')
          fs.mkdirSync(path.join(out, rel), { recursive: true })
          fs.writeFileSync(path.join(out, rel, 'index.html'), html)
          fs.writeFileSync(path.join(out, `${rel}.html`), html)
        }
        fs.writeFileSync(path.join(out, '404.html'), await page('/404'))

        // Emit every generated placeholder image referenced by the prerendered pages
        fs.mkdirSync(path.join(out, 'placeholders'), { recursive: true })
        for (const key of placeholders) {
          const [tone, seed] = key.split('|')
          fs.writeFileSync(path.join(out, 'placeholders', `${tone}-${seed}.svg`), facadeSvg(tone as ArtTone, Number(seed)))
        }

        const base = siteUrl.replace(/\/$/, '')
        const today = new Date().toISOString().slice(0, 10)
        const urls = (mod.sitemapRoutes() as string[])
          .map((r) => `  <url><loc>${base}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod></url>`)
          .join('\n')
        fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
        fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: ${new URL(base).pathname.replace(/\/$/, '')}/admin\n\nSitemap: ${base}/sitemap.xml\n`)
        this.info?.(`prerendered ${routes.length} routes, ${placeholders.size} placeholder images`)
      },
    },
  }
}

/** Dev server: generate placeholder SVGs on request. */
export function placeholderDev(): Plugin {
  return {
    name: 'facade:placeholders-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url?.match(/\/placeholders\/([a-z-]+?)-(\d+)\.svg/)
        if (!m) return next()
        res.setHeader('Content-Type', 'image/svg+xml')
        res.end(facadeSvg(m[1] as ArtTone, Number(m[2])))
      })
    },
  }
}

/**
 * `vite preview` that behaves like GitHub Pages: /x → x.html → x/index.html → 404.html (status 404).
 * Lets the E2E suite exercise the real deep-link + 404 behaviour of the deployment target.
 */
export function githubPagesPreview(): Plugin {
  let base = '/'
  let outDir = 'dist'
  return {
    name: 'facade:gh-pages-preview',
    configResolved(c) {
      base = c.base
      outDir = path.resolve(c.root, c.build.outDir)
    },
    configurePreviewServer(server) {
      // GitHub Pages serves HTML gzip-compressed; do the same so local audits are realistic
      const send = (req: { headers: Record<string, string | string[] | undefined> }, res: import('node:http').ServerResponse, body: Buffer) => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        if (String(req.headers['accept-encoding'] ?? '').includes('gzip')) {
          res.setHeader('Content-Encoding', 'gzip')
          return res.end(zlib.gzipSync(body))
        }
        res.end(body)
      }
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '/').split('?')[0])
        if (!url.startsWith(base)) return next()
        const rel = url.slice(base.length).replace(/\/$/, '')
        const file = path.join(outDir, rel)
        if (rel && fs.existsSync(file) && fs.statSync(file).isFile()) return next()
        for (const c of [rel ? `${rel}.html` : 'index.html', path.join(rel, 'index.html')]) {
          const f = path.join(outDir, c)
          if (fs.existsSync(f) && fs.statSync(f).isFile()) return send(req, res, fs.readFileSync(f))
        }
        res.statusCode = 404
        send(req, res, fs.readFileSync(path.join(outDir, '404.html')))
      })
    },
  }
}
