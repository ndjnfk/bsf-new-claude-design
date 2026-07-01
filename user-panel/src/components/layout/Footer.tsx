import { Link } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useLayoutUi } from '../../store/layoutUi'

// Footer links + social (from domain) + the mobile bottom tab bar. Mirrors the
// Angular FooterComponent; the inline SVG tab icons are rendered with Font Awesome
// (loaded globally) to keep the same .bottom-tabs structure the styles target.
export function Footer() {
  const domain = useAuth((s) => s.domain)
  const toggleRight = useLayoutUi((s) => s.toggleRight)

  const links = ['About us', 'Help', 'Security', 'Game Rules', 'Terms and Conditions', 'Responsible Gambling']

  return (
    <>
      <div className="content-page footer-content">
        <div className="row">
          <div id="footer-main" className="col-lg-9 d-col-9">
            <div className="footer1">
              <div className="links pt-4">
                <ul className="m-0 px-2 list-unstyled d-flex flex-wrap justify-content-center align-items-center">
                  {links.map((t) => (
                    <li key={t}>
                      <a role="button">{t}</a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-100 mx-auto t-blue rounded-pill d-flex py-3">
                <div className="mx-auto t-blue rounded-pill d-flex">
                  <ul className="m-0 px-1 py-0 px-md-3 d-flex align-items-center list-unstyled social_link">
                    {domain?.facebook ? (
                      <li>
                        <a href={String(domain?.facebook)} target="_blank" rel="noreferrer" className="px-1 h4 facebook">
                          <i className="fab fa-facebook" />
                        </a>
                      </li>
                    ) : null}
                    {domain?.instagram ? (
                      <li>
                        <a href={String(domain?.instagram)} target="_blank" rel="noreferrer" className="px-1 h4 instagram">
                          <i className="fab fa-instagram" />
                        </a>
                      </li>
                    ) : null}
                    {domain?.telegram ? (
                      <li>
                        <a href={String(domain?.telegram)} target="_blank" rel="noreferrer" className="px-1 h4 telegram">
                          <i className="fab fa-telegram" />
                        </a>
                      </li>
                    ) : null}
                    {domain?.mobile ? (
                      <li className="ms-auto text-warning">
                        <a href={`https://wa.me/${String(domain?.mobile)}`} target="_blank" rel="noreferrer" className="px-1 h4 whatsapp rounded-pill">
                          <i className="fab fa-whatsapp" />
                        </a>
                      </li>
                    ) : null}
                  </ul>
                </div>
                {domain?.mobile ? (
                  <ul className="ms-auto mb-0 px-1 py-0 px-md-3 d-flex list-unstyled">
                    <li className="ms-2 text-warning">
                      <span className="me-2">Contact No. :-</span>
                      <span>{String(domain?.mobile)}</span>
                    </li>
                  </ul>
                ) : null}
              </div>

              <div className="copyright text-center py-3">
                <span className="title fs-12 text-white">© Copyright 2023, All Rights Reserved</span>
              </div>
            </div>
          </div>
          <div className="col" />
        </div>
      </div>

      <div className="bottom-tabs d-lg-none">
        <ul>
          <li className="truncate">
            <Link id="home-tab" to="/home">
              <i className="fas fa-home" /> Home
            </Link>
          </li>
          <li id="inplay-tab" className="truncate">
            <Link to="/in-play">
              <i className="fas fa-play-circle" /> In-Play
            </Link>
          </li>
          <li className="truncate">
            <Link to="/bet-history">&nbsp;</Link>
          </li>
          <li id="wallet-tab" className="big">
            <Link to="/bet-history">
              <i className="fas fa-file-alt" style={{ fontSize: 28 }} />
            </Link>
          </li>
          <li className="truncate">
            <Link id="casino-tab" to="/dreamCasino">
              <i className="fas fa-dice" /> <span>Casino</span>
            </Link>
          </li>
          <li id="User-tab" className="truncate">
            <a role="button" onClick={toggleRight}>
              <i className="fas fa-user" /> <span className="username">User</span>
            </a>
          </li>
        </ul>
      </div>
    </>
  )
}
