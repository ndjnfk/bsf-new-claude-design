import { Link } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useLayoutUi } from '../../store/layoutUi'
import { useLogout } from '../../hooks/useLogout'

// Top navbar + headline marquee + slide-out side menu. Mirrors the Angular
// HeaderComponent structure; bindings come from the auth/layout stores and the
// slide menu open-state replaces the jQuery toggling.
export function Header() {
  const user = useAuth((s) => s.user)
  const domain = useAuth((s) => s.domain)
  const showDeposit = useAuth((s) => s.showDeposit)
  const sideMenuOpen = useLayoutUi((s) => s.sideMenuOpen)
  const toggleSideMenu = useLayoutUi((s) => s.toggleSideMenu)
  const closeSideMenu = useLayoutUi((s) => s.closeSideMenu)
  const logout = useLogout()

  const sideLinks: Array<[string, string]> = [
    ['/home', 'IN PLAY'],
    ['/rules', 'RULES'],
    ['/ledger', 'LEDGER'],
    ['/change-password', 'PASSWORD'],
    ['/poker', 'GAMES'],
    ['/setting', 'SETTINGS'],
    ['/tournament', 'TOURNAMENT'],
    ['/account-statement', 'STATEMENT'],
    ['/profit-loss', 'Profit Loss'],
    ['/bet-history', 'Bet History'],
    ['/login-history', 'Login History'],
    ['/password-history', 'Password History'],
  ]
  const depositLinks: Array<[string, string]> = [
    ['/request', 'Request Details'],
    ['/banks', 'Banks Details'],
    ['/deposit', 'Deposit'],
    ['/withdraw', 'Withdraw'],
  ]

  // Always show the welcome marquee on every page; append the domain's user
  // headline after it when one is configured (skipping the literal "undefined").
  const rawUserHeadline = domain?.user_headline
  const userHeadline =
    rawUserHeadline && String(rawUserHeadline) !== 'undefined' ? String(rawUserHeadline) : ''
  const marqueeText = ['welcome to bsf test', userHeadline].filter(Boolean).join('  •  ')
  const adminHeadline = domain?.admin_headline

  return (
    <>
      <header className="navbar-fixed-top navbar-inverse">
        <nav className="navbar navbar-expand-lg bg-transparent py-0">
          <div className="container-fluid p-0">
            <div className="d-flex align-self-baseline">
              <Link to="/userhome" className="logo mt-1" style={{ padding: '3px' }}>
                {domain?.logo ? <img src={domain?.logo} alt={domain?.name ?? ''} /> : null}
              </Link>
              <span className="user_profile_detail">
                <span className="header-user-nm">
                  {user?.mstruserid} ({user?.mstrname})
                </span>
                <span className="header-user-coins fs-12">
                  Coins : {user?.balance} &nbsp;&nbsp; Total Exp. : {user?.liability}
                </span>
              </span>
            </div>

            <button className="navbar-toggle d-lg-none" type="button" aria-label="Menu" onClick={toggleSideMenu}>
              <span>
                <span className="icon-bar" />
                <span className="icon-bar" />
                <span className="icon-bar" />
              </span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" to="/userhome">
                    <span>HOME</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/poker">
                    <span>GAMES</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/home">
                    <span>Inplay</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <a className="nav-link" role="button" onClick={() => void logout()}>
                    <span>Logout</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      <div className="mt-5em" />

      <div className="marquee-div d-flex align-items-center">
        <div className="marquee-wrapper">
          <div className="marquee-content">{marqueeText}</div>
        </div>
      </div>
      {adminHeadline ? (
        <div className="marquee-div bg-danger2">
          <div className="text-white">{String(adminHeadline)}</div>
        </div>
      ) : null}

      {/* Slide-out side menu (.side-menu.open driven by state, not jQuery). */}
      <div className={`side-menu${sideMenuOpen ? ' open' : ''}`}>
        <div className="side-header d-flex p-3 pb-0 justify-content-end">
          <button className="close-btn bg-transparent border-0" aria-label="Close" onClick={closeSideMenu}>
            ✕
          </button>
        </div>
        <ul className="menu__level">
          {sideLinks.map(([to, label]) => (
            <li className="menu__item" key={to}>
              <Link to={to} onClick={closeSideMenu}>
                {label}
              </Link>
            </li>
          ))}
          {showDeposit
            ? depositLinks.map(([to, label]) => (
                <li className="menu__item" key={to}>
                  <Link to={to} onClick={closeSideMenu}>
                    {label}
                  </Link>
                </li>
              ))
            : null}
          <li className="menu__item">
            <a role="button" onClick={() => void logout()}>
              LOGOUT
            </a>
          </li>
        </ul>
      </div>
    </>
  )
}
