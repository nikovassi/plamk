import { expect, test } from '@playwright/test'
import { expectNoBrokenImages, watchErrors } from './helpers'

const ROUTES = ['./', 'proekti', 'uslugi', 'produkti', 'produkti/hartieni-produkti', 'produkti/folia', 'kontakti', 'zapitvane', 'poveritelnost', 'usloviya', 'biskvitki',
  'proekti/zhilishtna-sgrada-keramichna-fasada', 'proekti/targovski-obekti-al-bond', 'uslugi/al-bond-montazh', 'uslugi/ventiliruemi-fasadi', 'uslugi/zimni-gradini', 'uslugi/industrialni-haleta', 'uslugi/metalni-vrati-i-ogradi']

test('every route renders without console errors, broken images or horizontal scroll', async ({ page }) => {
  const errors = watchErrors(page)
  for (const r of ROUTES) {
    const res = await page.goto(r)
    expect(res?.status(), r).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()
    await expectNoBrokenImages(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow on ${r}`).toBeLessThanOrEqual(0)
  }
  expect(errors).toEqual([])
})

test('SEO: title, description, canonical, structured data', async ({ page, request }) => {
  await page.goto('./')
  await expect(page).toHaveTitle(/хартиени продукти и фолиа/)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /фасад/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://nikovassi.github.io/plamk/')
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent!)['@type']).flat())
  expect(types).toEqual(expect.arrayContaining(['Organization', 'LocalBusiness', 'WebSite']))
  await page.goto('uslugi/hpl-fasadi')
  const t2 = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent!)['@type']))
  expect(t2).toEqual(expect.arrayContaining(['Service', 'BreadcrumbList']))
  const sitemap = await (await request.get('sitemap.xml')).text()
  expect(sitemap).toContain('/uslugi/al-bond-montazh')
  expect(sitemap).toContain('/proekti/zhilishtna-sgrada-keramichna-fasada')
  expect(sitemap).not.toContain('laminam')
  expect(await (await request.get('robots.txt')).text()).toContain('Sitemap:')
})

test('unknown URL → 404 status and helpful page (GitHub Pages behaviour)', async ({ page }) => {
  const errors = watchErrors(page)
  const res = await page.goto('nyama-takava-stranica')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: 'Тази страница не съществува' })).toBeVisible()
  await page.getByRole('link', { name: 'Поискай оферта' }).first().click()
  await expect(page.getByTestId('step-indicator')).toBeVisible()
  // the document itself is a 404 — that is the expected response, not an error
  expect(errors.filter((e) => !e.startsWith('404') && !e.includes('status of 404'))).toEqual([])
})

test('deep links work under the repository base path', async ({ page }) => {
  await page.goto('produkti/folia')
  await expect(page.getByRole('heading', { level: 1, name: 'Фолиа' })).toBeVisible()
  await page.getByRole('link', { name: 'Изпрати запитване' }).first().click()
  await expect(page).toHaveURL(/\/plamk\/zapitvane\?rezhim=barzo&interes=film/)
})

test('dark mode toggle persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('proekti')
  await page.getByRole('button', { name: 'Тъмна тема' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(bg).toBe('rgb(17, 18, 20)')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('gallery opens fullscreen with next / previous / close', async ({ page }) => {
  await page.goto('proekti/zhilishtna-sgrada-al-bond')
  await page.getByRole('button', { name: /Отвори снимка 1/ }).click()
  const dialog = page.getByRole('dialog', { name: /Галерия, снимка 1 от 2/ })
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: 'Следваща снимка' }).click()
  await expect(page.getByRole('dialog', { name: /снимка 2 от 2/ })).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('dialog', { name: /снимка 1 от 2/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test.describe('PWA', () => {
  test.use({ serviceWorkers: 'allow' })

  test('PWA: manifest, icons and service worker', async ({ page, request, browserName }) => {
    const manifest = await (await request.get('manifest.webmanifest')).json()
    expect(manifest.start_url).toBe('/plamk/')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3)
    for (const i of manifest.icons) expect((await request.get(i.src)).status()).toBe(200)
    test.skip(browserName !== 'chromium', 'service worker check runs on Chromium')
    await page.goto('./')
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)
    expect(scope).toContain('/plamk/')
  })
})

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only')

  test('sticky quote CTA appears on detail pages after scrolling', async ({ page }) => {
    await page.goto('uslugi/hpl-fasadi')
    const sticky = page.getByTestId('sticky-cta')
    await expect(sticky).toHaveAttribute('aria-hidden', 'true')
    await page.evaluate(() => window.scrollTo(0, 800))
    await expect(sticky).toHaveAttribute('aria-hidden', 'false')
    await expect(sticky.getByRole('link', { name: /Поискай оферта/ })).toBeInViewport()
  })

  test('touch targets in the bottom navigation are at least 44px', async ({ page }) => {
    await page.goto('./')
    const sizes = await page.getByTestId('bottom-nav').getByRole('link').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
    for (const h of sizes) expect(h).toBeGreaterThanOrEqual(44)
  })
})
