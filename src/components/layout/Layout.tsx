import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { StickyCta } from './StickyCta'
import { Footer } from './Footer'
import { useRevealObserver } from '../ui/Reveal'
import { trackPageview } from '../../lib/analytics'
import { PageFallback } from '../../routes'

export function Layout() {
  const { pathname } = useLocation()
  useRevealObserver()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    trackPageview()
  }, [pathname])
  const inQuote = pathname.startsWith('/zapitvane')
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
        Към съдържанието
      </a>
      {!inQuote && <Header />}
      <main id="main" tabIndex={-1} className="outline-none">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      {!inQuote && <Footer />}
      <StickyCta />
      <BottomNav />
    </>
  )
}
