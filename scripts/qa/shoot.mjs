import { chromium } from '@playwright/test'
const [,, out, pagesArg, vpArg, scheme = 'light', full = '1'] = process.argv
const vps = { m: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }, s: { width: 375, height: 667, isMobile: true, hasTouch: true }, t: { width: 768, height: 1024 }, d: { width: 1440, height: 900 } }
const browser = await chromium.launch()
const errors = []
for (const v of vpArg.split(',')) {
  const ctx = await browser.newContext({ viewport: { width: vps[v].width, height: vps[v].height }, isMobile: vps[v].isMobile, hasTouch: vps[v].hasTouch, colorScheme: scheme, reducedMotion: 'reduce', serviceWorkers: 'block' })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${v}] ${page.url()} ${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`[${v}] ${page.url()} pageerror: ${e.message}`))
  for (const p of pagesArg.split(',')) {
    await page.goto(`http://localhost:4380/plamk${p}`, { waitUntil: 'networkidle' })
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } window.scrollTo(0, 0) })
    await page.waitForTimeout(300)
    const name = `${out}/${v}-${scheme}-${p.replace(/[/?=&]/g, '_') || 'home'}.png`
    await page.screenshot({ path: name, fullPage: full === '1' })
  }
  await ctx.close()
}
await browser.close()
console.log(errors.length ? errors.join('\n') : 'no console errors')
