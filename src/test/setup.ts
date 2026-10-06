import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// jsdom gaps
if (!window.matchMedia)
  window.matchMedia = (q: string) =>
    ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }) as unknown as MediaQueryList
window.scrollTo = (() => {}) as typeof window.scrollTo
if (!('IntersectionObserver' in window)) {
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
  ;(window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO
}
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:mock'
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {}
