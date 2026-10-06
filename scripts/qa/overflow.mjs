import { chromium } from '@playwright/test'
const [,, pagesArg, w = '390'] = process.argv
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: +w, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
for (const p of pagesArg.split(',')) {
  await page.goto(`http://localhost:4380/plamk${p}`, { waitUntil: 'networkidle' })
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth
    const off = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > W + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.snap-row') && !e.closest('.sr-only') })
    return { sw: document.documentElement.scrollWidth, W, iw: innerWidth, off: off.slice(0, 6).map((e) => `${e.tagName}.${String(e.className).slice(0, 60)} r=${Math.round(e.getBoundingClientRect().right)}`) }
  })
  console.log(p, JSON.stringify(r))
}
await b.close()
