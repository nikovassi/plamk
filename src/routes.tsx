import { lazy, Suspense, type ComponentType } from 'react'
import type { RouteObject } from 'react-router'
import { Layout } from './components/layout/Layout'

/**
 * Route table. Every page is its own chunk; the prerenderer waits for them (react-dom/static)
 * and adds <link rel="modulepreload"> for the current route, so the first view hydrates without
 * a waterfall. After load, remaining pages are prefetched on idle → instant navigation.
 */
type Loader = () => Promise<{ default: ComponentType }>
const pages = {
  Home: () => import('./pages/Home'),
  Projects: () => import('./pages/Projects'),
  ProjectDetail: () => import('./pages/ProjectDetail'),
  Services: () => import('./pages/Services'),
  ServiceDetail: () => import('./pages/ServiceDetail'),
  Products: () => import('./pages/Products'),
  ProductDetail: () => import('./pages/ProductDetail'),
  Contact: () => import('./pages/Contact'),
  Quote: () => import('./pages/Quote'),
  Privacy: () => import('./pages/Privacy'),
  Terms: () => import('./pages/Terms'),
  Cookies: () => import('./pages/Cookies'),
  NotFound: () => import('./pages/NotFound'),
  Admin: () => import('./features/admin/AdminApp'),
} satisfies Record<string, Loader>
export type PageName = keyof typeof pages

/** Source module of each page — used by the prerenderer to find the client chunk to preload. */
export const pageModules: Record<PageName, string> = {
  Home: 'src/pages/Home.tsx', Projects: 'src/pages/Projects.tsx', ProjectDetail: 'src/pages/ProjectDetail.tsx',
  Services: 'src/pages/Services.tsx', ServiceDetail: 'src/pages/ServiceDetail.tsx',
  Products: 'src/pages/Products.tsx', ProductDetail: 'src/pages/ProductDetail.tsx',
  Contact: 'src/pages/Contact.tsx', Quote: 'src/pages/Quote.tsx', Privacy: 'src/pages/Privacy.tsx', Terms: 'src/pages/Terms.tsx',
  Cookies: 'src/pages/Cookies.tsx', NotFound: 'src/pages/NotFound.tsx', Admin: 'src/features/admin/AdminApp.tsx',
}

const components = Object.fromEntries(Object.entries(pages).map(([k, l]) => [k, lazy(l)])) as unknown as Record<PageName, ComponentType>
const el = (name: PageName) => {
  const C = components[name]
  return <C />
}

/** Likely next steps from any page: the quote flow and the main listings. */
const PREFETCH: PageName[] = ['Quote', 'Projects', 'ProjectDetail', 'Services', 'Products']
export const prefetchPages = () => PREFETCH.forEach((k) => void pages[k]().catch(() => {}))

export function PageFallback() {
  return (
    <div className="grid min-h-[100svh] place-items-center" role="status" aria-label="Зареждане">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  )
}

type AppRoute = RouteObject & { page?: PageName; children?: AppRoute[] }

export const routeConfig: AppRoute[] = [
  { path: '/admin/*', page: 'Admin', element: <Suspense fallback={<PageFallback />}>{el('Admin')}</Suspense> },
  {
    element: <Layout />,
    children: [
      { index: true, page: 'Home', element: el('Home') },
      { path: 'proekti', page: 'Projects', element: el('Projects') },
      { path: 'proekti/:slug', page: 'ProjectDetail', element: el('ProjectDetail') },
      { path: 'uslugi', page: 'Services', element: el('Services') },
      { path: 'uslugi/:slug', page: 'ServiceDetail', element: el('ServiceDetail') },
      { path: 'produkti', page: 'Products', element: el('Products') },
      { path: 'produkti/:slug', page: 'ProductDetail', element: el('ProductDetail') },
      { path: 'kontakti', page: 'Contact', element: el('Contact') },
      { path: 'zapitvane', page: 'Quote', element: el('Quote') },
      { path: 'poveritelnost', page: 'Privacy', element: el('Privacy') },
      { path: 'usloviya', page: 'Terms', element: el('Terms') },
      { path: 'biskvitki', page: 'Cookies', element: el('Cookies') },
      { path: '*', page: 'NotFound', element: el('NotFound') },
    ],
  },
]
