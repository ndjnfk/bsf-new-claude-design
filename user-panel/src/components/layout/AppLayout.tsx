import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { GlobalLoader } from '../common/GlobalLoader'
import { LayoutModals } from '../modals/LayoutModals'
import { useSports } from '../../store/sports'
import { useLayoutUi } from '../../store/layoutUi'
import { useBodyClass } from '../../hooks/useBodyClass'
import { useLiveBalance } from '../../hooks/useLiveBalance'

// Routes that render <app-footer> in the Angular source. Everywhere else the
// footer (and its mobile bottom-tab bar) is commented out, so we don't show it —
// otherwise its white-on-light text just floats on pages like /userhome.
const FOOTER_ROUTES = new Set(['/gamesCasino', '/gamesPoker', '/kingCasino', '/wallet-home'])

// Shell shared by all authenticated pages: header, sidebar drawers, footer, the
// page outlet, the global loader and the shared modals. The drawer open-state is
// synced to the body classes the migrated styles target (replacing jQuery).
export function AppLayout() {
  const loadSports = useSports((s) => s.loadSports)
  const leftOpen = useLayoutUi((s) => s.leftOpen)
  const rightOpen = useLayoutUi((s) => s.rightOpen)
  const { pathname } = useLocation()
  const showFooter = FOOTER_ROUTES.has(pathname)

  useBodyClass('sidebar-enable', leftOpen)
  useBodyClass('right-bar-enabled', rightOpen)

  // Live Coins + Total Exp. in the header/footer via the native-WS hub.
  useLiveBalance()

  useEffect(() => {
    void loadSports()
  }, [loadSports])

  return (
    <>
      <Header />
      <Sidebar />
      <div className="content-page">
        <Outlet />
      </div>
      {showFooter ? <Footer /> : null}
      <GlobalLoader />
      <LayoutModals />
    </>
  )
}
