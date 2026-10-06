import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAt } from './render'
import { projects } from '../content/projects'
import { productCategories } from '../content/products'
import { services } from '../content/services'

describe('routing', () => {
  it.each([
    ['/', /Фасади и търговия/],
    ['/proekti', /^Проекти$/],
    ['/uslugi', /^Услуги$/],
    ['/produkti', /^Продукти$/],
    ['/trudova-medicina', /Служба по трудова медицина/],
    ['/kontakti', /Свържете се с нас/],
    ['/poveritelnost', /Политика за поверителност/],
    ['/nyama-takava', /Тази страница не съществува/],
  ])('%s renders its page', async (path, heading) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })

  it('renders every project, material and service detail page', async () => {
    for (const [path, title] of [
      [`/proekti/${projects[0].slug}`, projects[0].title],
      [`/produkti/${productCategories[1].slug}`, productCategories[1].name],
      [`/uslugi/${services[2].slug}`, services[2].name],
    ]) {
      const { unmount } = renderAt(path)
      expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
      unmount()
    }
  })

  it('unknown slugs show 404', async () => {
    renderAt('/proekti/ne-sushtestvuva')
    expect(await screen.findByRole('heading', { level: 1, name: /не съществува/ })).toBeInTheDocument()
  })
})

describe('mobile navigation and CTA', () => {
  it('bottom navigation has all sections and a prominent quote action', async () => {
    renderAt('/')
    const nav = await screen.findByTestId('bottom-nav')
    for (const label of ['Начало', 'Услуги', 'Продукти', 'Контакти', 'Запитване']) expect(within(nav).getByRole('link', { name: new RegExp(label) })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /Запитване/ })).toHaveAttribute('href', '/zapitvane')
  })

  it('primary CTA is visible in the hero and leads to the quote form', async () => {
    renderAt('/')
    const hero = await screen.findByRole('region', { name: /Фасади и търговия/ })
    const cta = within(hero).getByRole('link', { name: /Поискай оферта/ })
    expect(cta.getAttribute('href')).toMatch(/^\/zapitvane/)
    expect(within(hero).getByRole('link', { name: /Продукти/ })).toHaveAttribute('href', '/produkti')
  })

  it('bottom navigation is hidden while the quote form is open', async () => {
    renderAt('/zapitvane')
    expect(await screen.findByText('Стъпка 1 от 7')).toBeInTheDocument()
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
  })

  it('bottom nav navigates between sections', async () => {
    renderAt('/')
    const nav = await screen.findByTestId('bottom-nav')
    await userEvent.click(within(nav).getByRole('link', { name: /Продукти/ }))
    expect(await screen.findByRole('heading', { level: 1, name: /^Продукти$/ })).toBeInTheDocument()
  })
})

describe('products', () => {
  it('product item links open the quick request with the interest and product prefilled', async () => {
    renderAt('/produkti/folia')
    const link = await screen.findByRole('link', { name: /Запитване за стреч фолио/ })
    expect(link.getAttribute('href')).toMatch(/rezhim=barzo&interes=film/)
    expect(link.getAttribute('href')).toContain(encodeURIComponent('Стреч фолио'))
  })

  it('quick request shows the product interests and prefills the product', async () => {
    renderAt(`/zapitvane?rezhim=barzo&interes=paper&produkt=${encodeURIComponent('Тоалетна хартия')}`)
    expect(await screen.findByRole('radio', { name: 'Хартиени продукти' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Фолиа' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Кратко описание/)).toHaveValue('Тоалетна хартия: ')
  })

  it('the facade wizard does not offer product categories as materials', async () => {
    renderAt('/zapitvane')
    await screen.findByText('Стъпка 1 от 7')
    expect(screen.queryByLabelText('Фолиа')).not.toBeInTheDocument()
  })
})

describe('occupational health', () => {
  it('CTAs open the quick request with the СТМ interest', async () => {
    renderAt('/trudova-medicina')
    const cta = within(await screen.findByRole('main')).getAllByRole('link', { name: /Поискай оферта/ })[0]
    expect(cta.getAttribute('href')).toMatch(/rezhim=barzo&interes=stm/)
    expect(screen.getAllByRole('link', { name: /Поискай оферта/ }).every((l) => /interes=stm/.test(l.getAttribute('href') ?? ''))).toBe(true)
    expect(screen.getByRole('link', { name: /Безплатен одит/ }).getAttribute('href')).toContain(encodeURIComponent('Безплатен одит на документацията'))
  })

  it('the quick request offers „Трудова медицина“', async () => {
    renderAt('/zapitvane?rezhim=barzo&interes=stm')
    expect(await screen.findByRole('radio', { name: 'Трудова медицина' })).toBeChecked()
  })
})

describe('project filters UI', () => {
  it('material chip filters the list and updates the count', async () => {
    renderAt('/proekti')
    const count = await screen.findByTestId('project-count')
    expect(count).toHaveTextContent(`${projects.length} проекта`)
    await userEvent.click(screen.getByRole('button', { name: /^HPL/ }))
    const n = projects.filter((p) => p.materials.includes('hpl')).length
    expect(screen.getByTestId('project-count')).toHaveTextContent(`${n} проект`)
    expect(screen.getByRole('button', { name: /^HPL/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
