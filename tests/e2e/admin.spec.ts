import { expect, test } from '@playwright/test'

/** Admin dashboard against a mocked Supabase API (auth + PostgREST + storage). */
const SB = 'https://supabase.e2e.test'
const lead = (o: Record<string, unknown>) => ({
  id: 'l1', reference: 'REQ-2026-0042', created_at: '2026-10-01T09:30:00Z', kind: 'full', status: 'new', name: 'Иван Петров', company: 'Строй ЕООД',
  phone: '+359888123456', email: 'ivan@firma.bg', project_type: 'office', service: 'full', materials: ['al-bond'], area: '250-500', city: 'Пловдив',
  address: 'бул. Марица 1', gps: null, has_project: 'yes', message: 'Офис сграда, 4 етажа.', source: 'hero',
  lead_files: [{ id: 'f1', path: 'l1/a-plan.pdf', name: 'plan.pdf', mime: 'application/pdf', size: 204800 }], ...o,
})

test('admin: login, filter, open lead, change status, add note', async ({ page }) => {
  const rows = [lead({}), lead({ id: 'l2', reference: 'REQ-2026-0043', name: 'Мария', city: 'Варна', materials: ['hpl'], status: 'quoted', lead_files: [] })]
  const patches: string[] = []
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' }
  await page.route(`${SB}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    const json = (body: unknown, status = 200) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (url.pathname === '/auth/v1/token') {
      const now = Math.floor(Date.now() / 1000)
      return json({ access_token: 'e2e.jwt.token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'r', user: { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'admin@firma.bg', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } })
    }
    if (url.pathname === '/rest/v1/leads' && req.method() === 'GET') return json(rows)
    if (url.pathname === '/rest/v1/leads' && req.method() === 'PATCH') { patches.push(req.postData() ?? ''); return route.fulfill({ status: 204, headers: cors }) }
    if (url.pathname === '/rest/v1/lead_notes' && req.method() === 'GET') return json([])
    if (url.pathname === '/rest/v1/lead_notes' && req.method() === 'POST')
      return json({ id: 'n1', lead_id: 'l1', author_email: 'admin@firma.bg', body: JSON.parse(req.postData()!).body, created_at: '2026-10-02T10:00:00Z' }, 201)
    if (url.pathname.startsWith('/storage/v1/object/sign')) return json([{ path: 'l1/a-plan.pdf', signedURL: '/object/sign/lead-files/l1/a-plan.pdf?token=t', error: null }])
    return json({ message: `unmocked ${req.method()} ${url.pathname}` }, 404)
  })

  await page.goto('admin')
  await expect(page).toHaveTitle(/администрация/)
  await page.getByLabel('Email').fill('admin@firma.bg')
  await page.getByLabel('Парола').fill('correct horse battery')
  await page.getByRole('button', { name: 'Вход' }).click()

  await expect(page.getByRole('heading', { name: 'Запитвания' })).toBeVisible()
  // default tab: "Ново"
  await expect(page.getByText('REQ-2026-0042')).toBeVisible()
  await expect(page.getByText('REQ-2026-0043')).toHaveCount(0)
  await page.getByRole('button', { name: /^Всички/ }).click()
  await expect(page.getByText('REQ-2026-0043')).toBeVisible()
  // search + material filter
  await page.getByPlaceholder(/Търси/).fill('Мария')
  await expect(page.getByText('REQ-2026-0042')).toHaveCount(0)
  await page.getByPlaceholder(/Търси/).fill('')
  await page.getByLabel('Материал').selectOption('al-bond')
  await expect(page.getByText('REQ-2026-0043')).toHaveCount(0)

  // details
  await page.getByRole('button', { name: 'Иван Петров' }).click()
  const d = page.getByRole('dialog', { name: 'Запитване REQ-2026-0042' })
  await expect(d).toContainText('Строй ЕООД')
  await expect(d).toContainText('250–500 m²')
  await expect(d).toContainText('бул. Марица 1')
  await expect(d.getByRole('link', { name: /plan\.pdf/ })).toBeVisible()
  await d.getByRole('button', { name: 'В процес' }).click()
  await expect.poll(() => patches.at(-1)).toContain('in_progress')
  await d.getByLabel('Нова бележка').fill('Обадих се, оглед в четвъртък.')
  await d.getByRole('button', { name: 'Добави бележка' }).click()
  await expect(d).toContainText('Обадих се, оглед в четвъртък.')
})
