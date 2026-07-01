// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.).
import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement window.scrollTo; stub it so ScrollToTop (scroll
// restoration) doesn't emit "Not implemented" noise during tests.
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true })
