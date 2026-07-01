import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scroll-position restoration equivalent to Angular's
// `RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })`:
// every navigation resets the scroll to the top of the page.
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
