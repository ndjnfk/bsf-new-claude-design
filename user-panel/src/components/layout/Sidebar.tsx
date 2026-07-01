import { Link } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useLayoutUi } from '../../store/layoutUi'
import { useLogout } from '../../hooks/useLogout'

// Right user drawer. Mirrors the Angular SidebarComponent; the drawer open/close
// (formerly jQuery body classes) is driven by the layout store + overlay clicks.
// (The left "All Sports" drawer was removed.)
export function Sidebar() {
  const user = useAuth((s) => s.user)
  const showDeposit = useAuth((s) => s.showDeposit)
  const toggleRight = useLayoutUi((s) => s.toggleRight)
  const openModal = useLayoutUi((s) => s.openModal)
  const logout = useLogout()

  const rightLinks: Array<[string, string]> = [
    ['/change-password', 'Edit Password'],
    ['/account-statement', 'Account Statement'],
    ['/profit-loss', 'Game Report'],
    ['/stake-value', 'Edit Stack'],
    ['/bet-history', 'Bet History'],
    ['/login-history', 'Login History'],
    ['/password-history', 'Password History'],
  ]
  const depositLinks: Array<[string, string]> = [
    ['/withdraw', 'Withdraw'],
    ['/deposit', 'Deposit'],
    ['/request', 'Request'],
  ]

  return (
    <>
      <div className="right-bar">
        <div className="user_header">
          <div className="user_header_info">
            <div className="user_header_autor">
              <span>
                username <br />
                <small className="fs-13"> {user?.mstrname} </small>
              </span>
            </div>
            <a role="button" onClick={() => openModal('bets')}>
              view
            </a>
          </div>
          <div className="user_btns">
            <Link to="/profit-loss" className="btn_pl" onClick={toggleRight}>
              Profit Loss
            </Link>
            <Link to="/account-statement" className="btn_statement" onClick={toggleRight}>
              Statements
            </Link>
          </div>
        </div>
        <div className="user-menus">
          <ul className="list-unstyled p-0 m-0">
            {rightLinks.map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="waves-effect waves-light" onClick={toggleRight}>
                  <span>{label}</span>
                </Link>
              </li>
            ))}
            {showDeposit
              ? depositLinks.map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="waves-effect waves-light" onClick={toggleRight}>
                      <span>{label}</span>
                    </Link>
                  </li>
                ))
              : null}
          </ul>
          <div className="w-100 text-center pt-3">
            <button
              className="btn btn-danger logout px-5"
              onClick={() => {
                toggleRight()
                void logout()
              }}
            >
              <i className="fas fa-sign-out pe-2" /> <span>logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Click-to-close overlay for the right user drawer. */}
      <div className="rightbar-overlay" onClick={toggleRight} />
    </>
  )
}
