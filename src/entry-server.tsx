import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { matchRoutes, StaticRouter } from 'react-router'
import { App } from './App'
import { HeadContext, renderHead, routerBase, type HeadData } from './lib/seo'
import { pageModules, routeConfig, type PageName } from './routes'
import { projects } from './content/projects'
import { services } from './content/services'
import { productCategories } from './content/products'

/** Routes to prerender. */
export function routes() {
  return [
    '/', '/proekti', '/uslugi', '/produkti', '/kontakti', '/zapitvane',
    '/poveritelnost', '/usloviya', '/biskvitki', '/admin',
    ...projects.map((p) => `/proekti/${p.slug}`),
    ...services.map((s) => `/uslugi/${s.slug}`),
    ...productCategories.map((c) => `/produkti/${c.slug}`),
  ]
}

/** Placeholder projects are prerendered (noindex) but kept out of the sitemap. */
export const sitemapRoutes = () =>
  routes().filter((r) => !['/zapitvane', '/admin'].includes(r) && !projects.some((p) => p.isPlaceholder && r === `/proekti/${p.slug}`))

/** Source modules rendered for a URL (for modulepreload hints). */
export function routeModules(url: string): string[] {
  const m = matchRoutes(routeConfig, url) ?? []
  return m.map((x) => (x.route as { page?: PageName }).page).filter(Boolean).map((p) => pageModules[p as PageName])
}

const fallbackHead: Record<string, HeadData> = {
  '/admin': { title: 'Администрация', description: 'Вход за администратори.', path: '/admin', noindex: true },
}

export async function render(url: string) {
  const ctx: { head?: HeadData } = {}
  const { prelude } = await prerender(
    <StrictMode>
      <HeadContext.Provider value={ctx}>
        <StaticRouter location={`${routerBase === '/' ? '' : routerBase}${url}`} basename={routerBase}>
          <App />
        </StaticRouter>
      </HeadContext.Provider>
    </StrictMode>,
  )
  const html = await new Response(prelude).text()
  const head = ctx.head ?? fallbackHead[url] ?? { title: 'ПЛАМК', description: '', path: url }
  return { html, head: renderHead(head) }
}
