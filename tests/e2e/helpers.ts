import { expect, type Page } from '@playwright/test'

/** Valid 1×1 PNG (browsers decode it for the thumbnail preview) */
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

/** Intercept the lead endpoint; returns the captured multipart body. */
export async function mockLeadEndpoint(page: Page, reference = 'REQ-2026-0042') {
  const captured: { body: string; contentType: string }[] = []
  await page.route('**/functions/v1/submit-lead', async (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } })
    captured.push({ body: req.postDataBuffer()?.toString('utf8') ?? '', contentType: req.headers()['content-type'] ?? '' })
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ reference }) })
  })
  return captured
}

/** Collect console errors + failed requests for the "no console errors / no broken images" checks. */
export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('submit-lead') && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`)
  })
  return errors
}

export async function expectNoBrokenImages(page: Page) {
  const broken = await page.evaluate(async () => {
    const imgs = [...document.images]
    for (const i of imgs) { i.loading = 'eager'; if (!i.complete) await new Promise((r) => { i.onload = i.onerror = r }) }
    return imgs.filter((i) => i.naturalWidth === 0).map((i) => i.currentSrc || i.src)
  })
  expect(broken).toEqual([])
}
