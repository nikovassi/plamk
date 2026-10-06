import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAt } from '../../test/render'
import { saveDraft, loadDraft } from '../../lib/lead/draft'
import * as submit from '../../lib/lead/submit'
import { makeFile, SIG } from '../../test/files'

afterEach(() => vi.restoreAllMocks())

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)))
/** Click "Напред" and let the wizard move focus to the new step heading (rAF) before typing. */
const next = async () => {
  await userEvent.click(screen.getByTestId('next-step'))
  await frame()
  await frame()
}

async function fillToContact() {
  renderAt('/zapitvane?ot=test')
  await screen.findByText('Стъпка 1 от 7')
  // keyboard/programmatic selection → no auto-advance, use "Напред"
  fireEvent.click(screen.getByLabelText('Офис'))
  await next()
  expect(screen.getByText('Стъпка 2 от 7')).toBeInTheDocument()
  fireEvent.click(screen.getByLabelText('Монтаж'))
  await next()
  fireEvent.click(screen.getByLabelText('HPL'))
  await next()
  fireEvent.click(screen.getByLabelText('100–250 m²'))
  fireEvent.click(screen.getByLabelText('Не'))
  expect(screen.getByText(/снимки на сградата и кратко описание са достатъчни/)).toBeInTheDocument()
  await next()
  await userEvent.type(screen.getByLabelText('Град / населено място'), 'Пловдив')
  await next()
  expect(screen.getByText('Стъпка 6 от 7')).toBeInTheDocument()
}

describe('quote wizard', () => {
  it('shows progress and blocks the step with a specific error', async () => {
    renderAt('/zapitvane')
    expect(await screen.findByText('Стъпка 1 от 7')).toBeInTheDocument()
    await next()
    expect(screen.getByRole('alert')).toHaveTextContent('Изберете тип на обекта.')
    expect(screen.getByText('Стъпка 1 от 7')).toBeInTheDocument()
  })

  it('"Не съм сигурен" for materials is exclusive', async () => {
    renderAt('/zapitvane')
    await screen.findByText('Стъпка 1 от 7')
    fireEvent.click(screen.getByLabelText('Хотел'))
    await next()
    fireEvent.click(screen.getByLabelText('Консултация'))
    await next()
    fireEvent.click(screen.getByLabelText('HPL'))
    fireEvent.click(screen.getByLabelText('Керамика'))
    expect(screen.getByLabelText('HPL')).toBeChecked()
    fireEvent.click(screen.getByLabelText('Не съм сигурен'))
    expect(screen.getByLabelText('HPL')).not.toBeChecked()
    expect(screen.getByLabelText('Не съм сигурен')).toBeChecked()
  })

  it('prefills material and service from the URL', async () => {
    renderAt('/zapitvane?material=keramika&usluga=consult')
    await screen.findByText('Стъпка 1 от 7')
    fireEvent.click(screen.getByLabelText('Офис'))
    await next()
    expect(screen.getByLabelText('Консултация')).toBeChecked()
    await next()
    expect(screen.getByLabelText('Керамика')).toBeChecked()
  })

  it('validates contact fields inline and submits end to end', async () => {
    const spy = vi.spyOn(submit, 'submitLead').mockImplementation(async (_p, _f, o) => {
      o?.onProgress?.(1)
      return { reference: 'REQ-2026-0042' }
    })
    await fillToContact()
    const input = screen.getByTestId('file-input') as HTMLInputElement
    await userEvent.upload(input, makeFile('facade.png', 'image/png', SIG.png))
    expect(await screen.findByText('facade.png')).toBeInTheDocument()
    await next()
    expect(screen.getByText('Стъпка 7 от 7')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Телефон'), '12')
    await userEvent.type(screen.getByLabelText(/^Email/), 'ivan@')
    await next()
    expect(screen.getByText('Въведете име (поне 2 символа).')).toBeInTheDocument()
    expect(screen.getByText(/9–15 цифри/)).toBeInTheDocument()
    expect(screen.getByText(/„@“ и домейн/)).toBeInTheDocument()
    expect(screen.getByText(/потвърдите, че сте запознати/)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Име'), 'Иван Петров')
    await userEvent.clear(screen.getByLabelText('Телефон'))
    await userEvent.type(screen.getByLabelText('Телефон'), '0888 123 456')
    await userEvent.clear(screen.getByLabelText(/^Email/))
    await userEvent.type(screen.getByLabelText(/^Email/), 'ivan@firma.bg')
    await userEvent.click(screen.getByRole('checkbox'))
    await next()

    const summary = await screen.findByTestId('summary')
    expect(summary).toHaveTextContent('Офис')
    expect(summary).toHaveTextContent('HPL')
    expect(summary).toHaveTextContent('Монтаж')
    expect(summary).toHaveTextContent('100–250 m²')
    expect(summary).toHaveTextContent('Пловдив')
    expect(summary).toHaveTextContent('facade.png')
    expect(summary).toHaveTextContent('0888 123 456')

    // Edit returns to the step, then back to the summary
    await userEvent.click(screen.getByRole('button', { name: 'Редактирай: Локация' }))
    expect(screen.getByText('Стъпка 5 от 7')).toBeInTheDocument()
    await next()
    expect(await screen.findByTestId('summary')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('submit-quote'))
    expect(await screen.findByTestId('success')).toBeInTheDocument()
    expect(screen.getByTestId('reference')).toHaveTextContent('REQ-2026-0042')
    expect(screen.getByRole('link', { name: 'Към началната страница' })).toHaveAttribute('href', '/')

    const [payload, files] = spy.mock.calls[0]
    expect(payload).toMatchObject({ kind: 'full', projectType: 'office', service: 'install', materials: ['hpl'], area: '100-250', hasProject: 'no', city: 'Пловдив', name: 'Иван Петров', phone: '0888 123 456', email: 'ivan@firma.bg' })
    expect(files).toHaveLength(1)
    await waitFor(() => expect(loadDraft()).toBeNull())
  })

  it('shows a clear error and keeps the data when sending fails', async () => {
    vi.spyOn(submit, 'submitLead').mockRejectedValue(new submit.SubmitError('network', 'Връзката прекъсна по време на изпращането.'))
    await fillToContact()
    await next()
    await userEvent.type(screen.getByLabelText('Име'), 'Иван')
    await userEvent.type(screen.getByLabelText('Телефон'), '0888123456')
    await userEvent.click(screen.getByRole('checkbox'))
    await next()
    await userEvent.click(await screen.findByTestId('submit-quote'))
    expect(await screen.findByTestId('send-error')).toHaveTextContent('Връзката прекъсна')
    expect(screen.getByRole('button', { name: /Опитай отново/ })).toBeInTheDocument()
    expect(screen.getByTestId('summary')).toHaveTextContent('Иван')
  })

  it('offers to resume an unfinished request', async () => {
    saveDraft({ projectType: 'hotel', service: 'full', materials: ['keramika'] }, 3)
    renderAt('/zapitvane')
    expect(await screen.findByText('Имате незавършено запитване.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Продължи/ }))
    expect(await screen.findByText('Стъпка 4 от 7')).toBeInTheDocument()
  })

  it('"Започни отначало" clears the draft', async () => {
    saveDraft({ projectType: 'hotel' }, 2)
    renderAt('/zapitvane')
    await userEvent.click(await screen.findByRole('button', { name: 'Започни отначало' }))
    expect(await screen.findByText('Стъпка 1 от 7')).toBeInTheDocument()
    expect(screen.getByLabelText('Хотел')).not.toBeChecked()
  })

  it('saves progress as a draft while typing', async () => {
    renderAt('/zapitvane')
    await screen.findByText('Стъпка 1 от 7')
    fireEvent.click(screen.getByLabelText('Търговски обект'))
    await waitFor(() => expect(loadDraft()?.data.projectType).toBe('retail'))
  })
})

describe('quick quote', () => {
  it('validates and sends a one-screen request', async () => {
    const spy = vi.spyOn(submit, 'submitLead').mockResolvedValue({ reference: 'REQ-2026-0043' })
    renderAt('/zapitvane?rezhim=barzo')
    await screen.findByRole('heading', { name: 'Бързо запитване' })
    await userEvent.click(screen.getByRole('button', { name: /Изпрати/ }))
    expect(screen.getByText('Въведете име (поне 2 символа).')).toBeInTheDocument()
    expect(screen.getByText(/Опишете накратко проекта — поне 10/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Име'), 'Мария')
    await userEvent.type(screen.getByLabelText('Телефон'), '0899 111 222')
    await userEvent.type(screen.getByLabelText('Град'), 'Варна')
    fireEvent.click(screen.getByLabelText('Не съм сигурен'))
    await userEvent.type(screen.getByLabelText('Кратко описание или количество'), 'Обновяване на фасада на магазин')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: /Изпрати/ }))
    expect(await screen.findByTestId('reference')).toHaveTextContent('REQ-2026-0043')
    expect(spy.mock.calls[0][0]).toMatchObject({ kind: 'quick', material: 'unsure', city: 'Варна' })
  })
})
