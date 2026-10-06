import { expect, test } from '@playwright/test'
import { mockLeadEndpoint } from './helpers'

test.describe('offline (PWA)', () => {
  test.use({ serviceWorkers: 'allow' })
  test.skip(({ browserName }) => browserName !== 'chromium', 'service worker offline emulation is reliable on Chromium')

  test('precached pages open offline; unknown pages show the offline screen', async ({ page, context }) => {
    await page.goto('./')
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    await page.reload() // now controlled by the service worker
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
    await context.setOffline(true)
    await page.goto('proekti')
    await expect(page.getByRole('heading', { level: 1, name: 'Проекти' })).toBeVisible()
    await page.goto('uslugi/zimni-gradini')
    await expect(page.getByRole('heading', { name: 'Няма интернет връзка' })).toBeVisible()
    await context.setOffline(false)
  })

  test('the quote form keeps the data and auto-sends when the connection returns', async ({ page, context }) => {
    const captured = await mockLeadEndpoint(page, 'REQ-2026-0099')
    await page.goto('zapitvane')
    await page.getByText('Офис', { exact: true }).click()
    await page.getByText('Консултация').click()
    await page.getByText('Керамика', { exact: true }).click()
    await page.getByTestId('next-step').click()
    await page.getByText('Не знам').click()
    await page.getByText('Да', { exact: true }).click()
    await page.getByTestId('next-step').click()
    await page.getByLabel('Град / населено място').fill('София')
    await page.getByTestId('next-step').click()
    await page.getByTestId('next-step').click()
    await page.getByLabel('Име').fill('Петър')
    await page.getByLabel('Телефон').fill('0888111222')
    await page.getByRole('checkbox').check()
    await page.getByTestId('next-step').click()

    await context.setOffline(true)
    await page.getByTestId('submit-quote').click()
    await expect(page.getByTestId('send-error')).toContainText('Няма интернет връзка')
    await expect(page.getByTestId('summary')).toContainText('Петър')
    expect(captured).toHaveLength(0)

    await context.setOffline(false)
    await expect(page.getByTestId('reference')).toHaveText('REQ-2026-0099')
    expect(captured).toHaveLength(1)
  })
})
