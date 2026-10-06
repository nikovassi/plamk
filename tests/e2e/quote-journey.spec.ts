import { expect, test } from '@playwright/test'
import { mockLeadEndpoint, PNG, watchErrors } from './helpers'

test('main journey: projects → case study → quote → upload → success', async ({ page, isMobile }) => {
  const errors = watchErrors(page)
  const captured = await mockLeadEndpoint(page)
  const t0 = Date.now()

  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: 'Фасади и търговия' })).toBeVisible()
  // primary CTA visible in the first viewport
  await expect(page.getByRole('region', { name: 'Фасади и търговия' }).getByRole('link', { name: /Поискай оферта/ })).toBeInViewport()

  // → Projects
  if (isMobile) await page.getByRole('link', { name: 'Всички проекти' }).click()
  else await page.getByRole('navigation', { name: 'Основна навигация' }).getByRole('link', { name: 'Проекти' }).click()
  await expect(page).toHaveURL(/\/proekti$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Проекти' })).toBeVisible()

  // filter + open project
  await page.getByRole('button', { name: /^HPL/ }).click()
  await expect(page).toHaveURL(/material=hpl/)
  await page.getByRole('link', { name: /Фасади от HPL с дървесен декор/ }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Фасади от HPL с дървесен декор' })).toBeVisible()

  // → Request quote from the case study CTA
  await page.getByRole('region', { name: 'Запитване за оферта' }).getByRole('link', { name: /Поискай оферта/ }).click()
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 1 от 7')
  if (isMobile) await expect(page.getByTestId('bottom-nav')).toHaveCount(0)

  // single-choice taps auto-advance
  await page.getByText('Жилищна сграда', { exact: true }).click()
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 2 от 7')
  await page.getByText('Проектиране + доставка + монтаж').click()
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 3 от 7')

  // material (multi-select)
  await page.getByText('HPL', { exact: true }).click()
  await page.getByTestId('next-step').click()

  await page.getByRole('radiogroup').first().getByText('250–500 m²').click()
  await page.getByText('В процес е').click()
  await page.getByTestId('next-step').click()

  await page.getByLabel('Град / населено място').fill('Пловдив')
  await page.getByTestId('next-step').click()

  // upload an image
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 6 от 7')
  await page.getByTestId('file-input').setInputFiles({ name: 'sgrada.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByTestId('file-list')).toContainText('sgrada.png')
  // an executable is rejected with a specific reason
  await page.getByTestId('file-input').setInputFiles({ name: 'virus.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') })
  await expect(page.getByTestId('file-errors')).toContainText('изпълними')
  await page.getByTestId('next-step').click()

  // contact
  await page.getByLabel('Име').fill('Иван Петров')
  await page.getByLabel('Телефон').fill('0888 123 456')
  await page.getByLabel(/^Email/).fill('ivan@firma.bg')
  await page.getByRole('checkbox').check()
  await page.getByTestId('next-step').click()

  // summary
  const summary = page.getByTestId('summary')
  await expect(summary).toContainText('Жилищна сграда')
  await expect(summary).toContainText('HPL')
  await expect(summary).toContainText('Проектиране + доставка + монтаж')
  await expect(summary).toContainText('250–500 m²')
  await expect(summary).toContainText('Пловдив')
  await expect(summary).toContainText('sgrada.png')

  await page.getByTestId('submit-quote').click()
  await expect(page.getByTestId('success')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Запитването е изпратено.' })).toBeVisible()
  await expect(page.getByTestId('reference')).toHaveText('REQ-2026-0042')
  await expect(page.getByRole('link', { name: 'Към началната страница' })).toBeVisible()

  // the request carried the structured payload and the file
  expect(captured).toHaveLength(1)
  expect(captured[0].contentType).toContain('multipart/form-data')
  expect(captured[0].body).toContain('"kind":"full"')
  expect(captured[0].body).toContain('"materials":["hpl"]')
  expect(captured[0].body).toContain('filename="sgrada.png"')
  expect(captured[0].body).toContain('"source":"project-hpl-fasadi-darvesen-dekor"')

  // the core principle: home → sent in well under 60 s (automation is faster, but guards regressions)
  expect(Date.now() - t0).toBeLessThan(60_000)
  expect(errors).toEqual([])
})

test('secondary journey: no ready project → photos → "Не съм сигурен"', async ({ page }) => {
  const captured = await mockLeadEndpoint(page, 'REQ-2026-0050')
  await page.goto('zapitvane')
  await page.getByText('Друго', { exact: true }).click()
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 2 от 7')
  await page.getByText('Не съм сигурен', { exact: true }).click()
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 3 от 7')
  await page.getByText('Не съм сигурен', { exact: true }).click()
  await page.getByTestId('next-step').click()
  await page.getByText('Не знам').click()
  await page.getByRole('radiogroup').nth(1).getByText('Не', { exact: true }).click()
  await expect(page.getByText(/снимки на сградата и кратко описание са достатъчни/)).toBeVisible()
  await page.getByTestId('next-step').click()
  await page.getByLabel('Град / населено място').fill('Русе')
  await page.getByTestId('next-step').click()
  await page.getByTestId('file-input').setInputFiles([
    { name: 'front.png', mimeType: 'image/png', buffer: PNG },
    { name: 'side.png', mimeType: 'image/png', buffer: PNG },
  ])
  await expect(page.getByTestId('file-list')).toContainText('side.png')
  await page.getByTestId('next-step').click()
  await page.getByLabel('Име').fill('Мария')
  await page.getByLabel('Телефон').fill('+359 899 111 222')
  await page.getByLabel(/Опишете накратко/).fill('Двуетажна къща, искаме нова облицовка на фасадата.')
  await page.getByRole('checkbox').check()
  await page.getByTestId('next-step').click()
  await page.getByTestId('submit-quote').click()
  await expect(page.getByTestId('reference')).toHaveText('REQ-2026-0050')
  expect(captured[0].body).toContain('"hasProject":"no"')
  expect(captured[0].body).toContain('"materials":["unsure"]')
})

test('validation errors are shown next to the field', async ({ page }) => {
  await page.goto('zapitvane')
  await page.getByTestId('next-step').click()
  await expect(page.getByRole('alert')).toHaveText(/Изберете тип на обекта/)
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 1 от 7')
})

test('draft survives closing the app and can be resumed or discarded', async ({ page }) => {
  await page.goto('zapitvane')
  await page.getByText('Хотел', { exact: true }).click()
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 2 от 7')
  await page.getByText('Консултация').click()
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 3 от 7')
  await page.waitForTimeout(400)
  await page.goto('./')
  await page.goto('zapitvane')
  await expect(page.getByText('Имате незавършено запитване.')).toBeVisible()
  await page.getByRole('button', { name: 'Продължи' }).click()
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 3 от 7')
  await page.reload()
  await page.getByRole('button', { name: 'Започни отначало' }).click()
  await expect(page.getByTestId('step-indicator')).toHaveText('Стъпка 1 от 7')
})

test('quick quote', async ({ page }) => {
  const captured = await mockLeadEndpoint(page, 'REQ-2026-0051')
  await page.goto('zapitvane?rezhim=barzo')
  await page.getByLabel('Име').fill('Георги')
  await page.getByLabel('Телефон').fill('0877 000 111')
  await page.getByLabel('Град').fill('Бургас')
  await page.getByText('Al Bond', { exact: true }).click()
  await page.getByLabel('Кратко описание или количество').fill('Козирка и обшивка на магазин')
  await page.getByTestId('file-input').setInputFiles({ name: 'magazin.png', mimeType: 'image/png', buffer: PNG })
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Изпрати' }).click()
  await expect(page.getByTestId('reference')).toHaveText('REQ-2026-0051')
  expect(captured[0].body).toContain('"kind":"quick"')
})

test('product journey: products → film → quick request with product prefilled', async ({ page }) => {
  const captured = await mockLeadEndpoint(page, 'REQ-2026-0077')
  await page.goto('produkti')
  await page.getByRole('link', { name: /Фолиа/ }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Фолиа' })).toBeVisible()
  await page.getByRole('link', { name: /Запитване за стреч фолио/ }).click()
  await expect(page.getByRole('heading', { name: 'Бързо запитване' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Фолиа' })).toBeChecked()
  await expect(page.getByLabel('Кратко описание или количество')).toHaveValue('Стреч фолио: ')
  await page.getByLabel('Кратко описание или количество').press('End')
  await page.getByLabel('Кратко описание или количество').pressSequentially('20 ролки, машинно')
  await page.getByLabel('Име').fill('Петя')
  await page.getByLabel('Телефон').fill('0888 000 222')
  await page.getByLabel('Град').fill('Казанлък')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Изпрати' }).click()
  await expect(page.getByTestId('reference')).toHaveText('REQ-2026-0077')
  expect(captured[0].body).toContain('"material":"film"')
  expect(captured[0].body).toContain('Стреч фолио: 20 ролки')
})
